import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useHealth } from '@/contexts/HealthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Loader2, Sparkles, Trash2, AlertTriangle, Clock, TrendingDown, Plus, MessageSquare, ChevronLeft, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateHealthAlerts } from '@/lib/healthAlerts';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Msg = { role: 'user' | 'assistant'; content: string; attachmentName?: string };
type FileAttachment = { base64: string; mimeType: string; name: string };
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
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);

  useEffect(() => { loadConversations(); }, []);

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
    if (error || !conv) return null;
    setConversations(prev => [{ id: conv.id, title, updated_at: new Date().toISOString() }, ...prev]);
    setActiveConvId(conv.id);
    return conv.id;
  };

  const saveMessage = async (convId: string, role: 'user' | 'assistant', content: string) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;
    await supabase.from('chat_messages').insert({
      conversation_id: convId, user_id: session.session.user.id, role, content,
    });
    await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from('chat_conversations').delete().eq('id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); }
  };

  const startNewChat = () => { setActiveConvId(null); setMessages([]); setShowSidebar(false); };

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
      default: return <Sparkles className="w-3 h-3 shrink-0 text-primary/60" />;
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

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo: 10MB.'); return; }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) { toast.error('Formato não suportado. Use PDF, JPG, PNG ou WebP.'); return; }
    try {
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      setAttachment({ base64, mimeType: file.type, name: file.name });
      toast.success(`Arquivo "${file.name}" anexado.`);
    } catch { toast.error('Erro ao ler o arquivo.'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && !attachment) || isLoading) return;
    const displayText = text.trim() || (attachment ? `📎 ${attachment.name}` : '');
    const userMsg: Msg = { role: 'user', content: displayText, attachmentName: attachment?.name };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    const currentAttachment = attachment;
    setAttachment(null);
    setIsLoading(true);

    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation(displayText);
      if (!convId) { toast.error('Erro ao criar conversa.'); setIsLoading(false); return; }
    }
    await saveMessage(convId, 'user', displayText);

    let assistantSoFar = '';
    try {
      const bodyPayload: any = {
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        healthContext: buildHealthContext(),
      };
      if (currentAttachment) {
        bodyPayload.attachment = { base64: currentAttachment.base64, mimeType: currentAttachment.mimeType };
      }
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify(bodyPayload),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' })); throw new Error(err.error || `Erro ${resp.status}`); }
      if (!resp.body) throw new Error('Stream não disponível');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
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
          } catch { textBuffer = line + '\n' + textBuffer; break; }
        }
      }
      if (assistantSoFar && convId) await saveMessage(convId, 'assistant', assistantSoFar);
    } catch (e: any) {
      const errorMsg = `❌ ${e.message || 'Erro ao conectar com a IA.'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally { setIsLoading(false); }
  }, [messages, isLoading, buildHealthContext, activeConvId, attachment]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="relative flex h-[600px] glass-card rounded-2xl overflow-hidden">
      {/* Sidebar overlay on mobile */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm sm:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`${showSidebar ? 'flex absolute inset-y-0 left-0 z-50 w-64' : 'hidden'} sm:relative sm:flex sm:w-56 flex-col shrink-0 border-r border-border/40 bg-background/90 backdrop-blur-xl sm:bg-secondary/10`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Conversas</span>
          <button onClick={startNewChat} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Nova conversa">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">Nenhuma conversa ainda</p>
          ) : (
            conversations.map(c => (
              <div
                key={c.id}
                className={`group flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-xs transition-all ${
                  activeConvId === c.id ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
                onClick={() => loadMessages(c.id)}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1 font-medium">{c.title}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/20 transition-all"
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/10 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setShowSidebar(!showSidebar)} className="sm:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${showSidebar ? 'rotate-0' : 'rotate-180'}`} />
            </button>
            <div className="w-7 h-7 rounded-lg bg-primary/12 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-bold">Chat com IA</span>
            {conversations.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full font-semibold">
                {conversations.length}
              </span>
            )}
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-xl hover:bg-secondary font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center liquid-glow"
              >
                <Bot className="w-8 h-8 text-primary" />
              </motion.div>
              <div>
                <p className="text-base font-bold">Pergunte sobre sua saúde</p>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                  A IA tem acesso aos seus biomarcadores, exames e estilo de vida para dar respostas personalizadas
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {dynamicSuggestions.map(s => (
                  <motion.button
                    key={s.text}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl border border-border/50 bg-secondary/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-left font-medium"
                  >
                    {suggestionIcon(s.icon)}
                    {s.text}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-foreground backdrop-blur-sm'
              }`}>
                {msg.role === 'user' && msg.attachmentName && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs opacity-80">
                    <Paperclip className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{msg.attachmentName}</span>
                  </div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5 [&>h3]:mt-3 [&>h3]:mb-1.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center mt-0.5">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2.5"
            >
              <div className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-secondary/50 rounded-2xl px-4 py-3 flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
                <span className="text-xs text-muted-foreground font-medium">Pensando...</span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/40 px-4 py-3 bg-secondary/10 backdrop-blur-sm">
          {attachment && (
            <div className="flex items-center gap-2 mb-2.5 px-3 py-2 bg-primary/10 rounded-xl text-xs">
              {attachment.mimeType === 'application/pdf' ? (
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
              <span className="truncate flex-1 text-foreground font-medium">{attachment.name}</span>
              <button onClick={() => setAttachment(null)} className="p-1 rounded-lg hover:bg-destructive/20 transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="shrink-0 w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Anexar resultado de exame"
            >
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachment ? "Descreva o que quer saber sobre o exame..." : "Pergunte sobre seus exames, biomarcadores..."}
              rows={1}
              className="flex-1 bg-secondary/50 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[42px] max-h-[100px] font-medium"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={(!input.trim() && !attachment) || isLoading}
              className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-press"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center font-medium">
            Respostas informativas — não substituem orientação médica
          </p>
        </div>
      </div>
    </div>
  );
}