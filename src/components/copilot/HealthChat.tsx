import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useHealth } from '@/contexts/HealthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Loader2, Sparkles, Trash2, AlertTriangle, Clock, TrendingDown, Plus, MessageSquare, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateHealthAlerts } from '@/lib/healthAlerts';
import { toast } from 'sonner';

type Msg = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; updated_at: string };

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const savingRef = useRef(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoadingConvs(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setLoadingConvs(false); return; }

    const { data: convs } = await supabase
      .from('chat_conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);

    setConversations(convs || []);
    setLoadingConvs(false);
  };

  const loadMessages = async (convId: string) => {
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages((msgs || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
    setActiveConvId(convId);
    setShowSidebar(false);
  };

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return null;

    const title = firstMessage.length > 40 ? firstMessage.slice(0, 40) + '…' : firstMessage;
    const { data: conv, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: session.session.user.id, title })
      .select('id')
      .single();

    if (error || !conv) {
      console.error('Failed to create conversation:', error);
      return null;
    }

    setConversations(prev => [{ id: conv.id, title, updated_at: new Date().toISOString() }, ...prev]);
    setActiveConvId(conv.id);
    return conv.id;
  };

  const saveMessage = async (convId: string, role: 'user' | 'assistant', content: string) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    await supabase.from('chat_messages').insert({
      conversation_id: convId,
      user_id: session.session.user.id,
      role,
      content,
    });

    // Update conversation timestamp
    await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from('chat_conversations').delete().eq('id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setShowSidebar(false);
  };

  // Dynamic suggestions
  const dynamicSuggestions = useMemo(() => {
    const suggestions: DynamicSuggestion[] = [];
    const alerts = generateHealthAlerts(data);

    const criticalBio = data.biomarkers.filter(b => b.status === 'red' && b.value !== null);
    if (criticalBio.length > 0) {
      const names = criticalBio.slice(0, 2).map(b => b.name).join(' e ');
      suggestions.push({ text: `Por que meu ${names} está fora do normal e o que fazer?`, icon: 'alert', priority: 1 });
    }

    const warningBio = data.biomarkers.filter(b => b.status === 'yellow' && b.value !== null);
    if (warningBio.length > 0) {
      suggestions.push({ text: `Meu ${warningBio[0].name} está na zona de atenção — devo me preocupar?`, icon: 'alert', priority: 2 });
    }

    const overdueExams = data.exams.filter(e => e.status === 'Atrasado');
    if (overdueExams.length > 0) {
      suggestions.push({ text: `Tenho ${overdueExams.length} exame(s) atrasado(s). Quais são mais urgentes?`, icon: 'clock', priority: 1 });
    }

    const upcomingExams = data.exams.filter(e => e.status === 'Próximo');
    if (upcomingExams.length > 0) {
      suggestions.push({ text: `Quais exames vencem em breve e como me preparar?`, icon: 'clock', priority: 3 });
    }

    const worseningAlerts = alerts.filter(a => a.type === 'trend_worsening');
    if (worseningAlerts.length > 0) {
      const name = worseningAlerts[0].title.replace(' em tendência de piora', '');
      suggestions.push({ text: `${name} está piorando — o que pode estar causando isso?`, icon: 'trend', priority: 2 });
    }

    suggestions.sort((a, b) => a.priority - b.priority);
    const result = suggestions.slice(0, 4);
    if (result.length < 3) {
      for (const fb of FALLBACK_SUGGESTIONS) {
        if (result.length >= 4) break;
        if (!result.some(r => r.text === fb)) result.push({ text: fb, icon: 'default', priority: 10 });
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

    // Create conversation if new
    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation(text.trim());
      if (!convId) {
        toast.error('Erro ao criar conversa.');
        setIsLoading(false);
        return;
      }
    }

    // Save user message
    await saveMessage(convId, 'user', text.trim());

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

      // Save assistant message after streaming completes
      if (assistantSoFar && convId) {
        await saveMessage(convId, 'assistant', assistantSoFar);
      }
    } catch (e: any) {
      const errorMsg = `❌ ${e.message || 'Erro ao conectar com a IA.'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, buildHealthContext, activeConvId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[600px] glass-card rounded-xl overflow-hidden border border-border/50">
      {/* Sidebar - overlay on mobile, inline on desktop */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" onClick={() => setShowSidebar(false)} />
      )}
      <div className={`${showSidebar ? 'flex absolute inset-y-0 left-0 z-50 w-64' : 'hidden'} sm:relative sm:flex sm:w-56 flex-col shrink-0 border-r border-border/50 bg-background sm:bg-secondary/20`}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversas</span>
          <button onClick={startNewChat} className="p-1 rounded hover:bg-secondary transition-colors" title="Nova conversa">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-3">Nenhuma conversa ainda</p>
          ) : (
            conversations.map(c => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer text-xs transition-colors ${
                  activeConvId === c.id ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
                onClick={() => loadMessages(c.id)}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1">{c.title}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSidebar(!showSidebar)} className="sm:hidden p-1 rounded hover:bg-secondary transition-colors">
              <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${showSidebar ? 'rotate-0' : 'rotate-180'}`} />
            </button>
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Chat com IA</span>
            {conversations.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-full">
                {conversations.length}
              </span>
            )}
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova</span>
          </button>
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
                {dynamicSuggestions.map(s => (
                  <button
                    key={s.text}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/50 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-left"
                  >
                    {suggestionIcon(s.icon)}
                    {s.text}
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
    </div>
  );
}
