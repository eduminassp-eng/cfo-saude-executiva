import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useHealth } from '@/contexts/HealthContext';
import { Send, Bot, User, Loader2, Sparkles, Trash2, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateHealthAlerts } from '@/lib/healthAlerts';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-chat`;

const FALLBACK_SUGGESTIONS = [
  'Resuma minha saúde em poucas frases',
  'Quais exames devo priorizar agora?',
  'Me dê dicas para melhorar meu estilo de vida',
];

interface DynamicSuggestion {
  text: string;
  icon: 'alert' | 'clock' | 'trend' | 'default';
  priority: number;
}

export function HealthChat() {
  const { data } = useHealth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const dynamicSuggestions = useMemo(() => {
    const suggestions: DynamicSuggestion[] = [];
    const alerts = generateHealthAlerts(data);

    // Critical biomarkers
    const criticalBio = data.biomarkers.filter(b => b.status === 'red' && b.value !== null);
    if (criticalBio.length > 0) {
      const names = criticalBio.slice(0, 2).map(b => b.name).join(' e ');
      suggestions.push({
        text: `Por que meu ${names} está fora do normal e o que fazer?`,
        icon: 'alert',
        priority: 1,
      });
    }

    // Warning biomarkers
    const warningBio = data.biomarkers.filter(b => b.status === 'yellow' && b.value !== null);
    if (warningBio.length > 0) {
      const name = warningBio[0].name;
      suggestions.push({
        text: `Meu ${name} está na zona de atenção — devo me preocupar?`,
        icon: 'alert',
        priority: 2,
      });
    }

    // Overdue exams
    const overdueExams = data.exams.filter(e => e.status === 'Atrasado');
    if (overdueExams.length > 0) {
      suggestions.push({
        text: `Tenho ${overdueExams.length} exame(s) atrasado(s). Quais são mais urgentes?`,
        icon: 'clock',
        priority: 1,
      });
    }

    // Upcoming exams
    const upcomingExams = data.exams.filter(e => e.status === 'Próximo');
    if (upcomingExams.length > 0) {
      suggestions.push({
        text: `Quais exames vencem em breve e como me preparar?`,
        icon: 'clock',
        priority: 3,
      });
    }

    // Worsening trends
    const worseningAlerts = alerts.filter(a => a.type === 'trend_worsening');
    if (worseningAlerts.length > 0) {
      const name = worseningAlerts[0].title.replace(' em tendência de piora', '');
      suggestions.push({
        text: `${name} está piorando — o que pode estar causando isso?`,
        icon: 'trend',
        priority: 2,
      });
    }

    // Sort by priority and cap at 4
    suggestions.sort((a, b) => a.priority - b.priority);
    const result = suggestions.slice(0, 4);

    // Fill remaining slots with fallback
    if (result.length < 3) {
      for (const fb of FALLBACK_SUGGESTIONS) {
        if (result.length >= 4) break;
        if (!result.some(r => r.text === fb)) {
          result.push({ text: fb, icon: 'default', priority: 10 });
        }
      }
    }

    return result;
  }, [data]);

  const suggestionIcon = (icon: DynamicSuggestion['icon']) => {
    switch (icon) {
      case 'alert': return <AlertTriangle className="w-3 h-3 shrink-0 text-destructive" />;
      case 'clock': return <Clock className="w-3 h-3 shrink-0 text-status-yellow" />;
      case 'trend': return <TrendingDown className="w-3 h-3 shrink-0 text-status-yellow" />;
      default: return null;
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildHealthContext = useCallback(() => {
    const bioLines = data.biomarkers
      .filter(b => b.value !== null)
      .map(b => `- ${b.name}: ${b.value} ${b.unit} (ref: ${b.targetMin ?? '?'}–${b.targetMax ?? '?'}) [${b.status}]${b.lastDate ? ` em ${b.lastDate}` : ''}`)
      .join('\n');

    const examLines = data.exams
      .map(e => `- ${e.name}: ${e.status}${e.lastDate ? ` (último: ${e.lastDate})` : ''}${e.resultSummary ? ` — ${e.resultSummary}` : ''}`)
      .join('\n');

    const ls = data.lifestyle;
    const lifestyleLine = `Exercício: ${ls.exerciseFrequency}x/sem, Sono: ${ls.sleepHours}h, Passos: ${ls.dailySteps}, FC média: ${ls.avgHeartRate}bpm, Tabagismo: ${ls.smokingStatus}, Álcool: ${ls.alcoholWeekly} doses/sem${ls.weight ? `, Peso: ${ls.weight}kg` : ''}`;

    return `BIOMARCADORES:\n${bioLines || 'Nenhum'}\n\nEXAMES:\n${examLines || 'Nenhum'}\n\nESTILO DE VIDA:\n${lifestyleLine}`;
  }, [data]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          healthContext: buildHealthContext(),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('Stream não disponível');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: 'assistant', content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${e.message || 'Erro ao conectar com a IA.'}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, buildHealthContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-[600px] glass-card rounded-xl overflow-hidden border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Chat com IA</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
            title="Limpar conversa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Bot className="w-10 h-10 text-primary/40" />
            <div>
              <p className="text-sm font-medium text-foreground">Pergunte sobre sua saúde</p>
              <p className="text-xs text-muted-foreground mt-1">
                A IA tem acesso aos seus biomarcadores, exames e estilo de vida
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/50 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/60 text-foreground'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h3]:mt-2 [&>h3]:mb-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2.5">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-secondary/60 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pensando...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-3 py-2.5 bg-secondary/20">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre seus exames, biomarcadores..."
            rows={1}
            className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[38px] max-h-[100px]"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Respostas informativas — não substituem orientação médica
        </p>
      </div>
    </div>
  );
}
