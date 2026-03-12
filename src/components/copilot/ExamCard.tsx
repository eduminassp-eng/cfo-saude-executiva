import { ExamInsight } from '@/lib/copilot';
import { ChevronRight, ArrowRight, MessageCircleQuestion, Clock, Stethoscope, ShieldAlert, CalendarDays, FileText, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const examStatusConfig: Record<string, { colorVar: string; label: string }> = {
  'Em dia': { colorVar: '--status-green', label: 'Em dia' },
  'Próximo': { colorVar: '--status-yellow', label: 'Próximo' },
  'Atrasado': { colorVar: '--status-red', label: 'Atrasado' },
  'Pendente': { colorVar: '--muted-foreground', label: 'Pendente' },
};

const importanceConfig: Record<string, { colorVar: string }> = {
  'Alta': { colorVar: '--status-red' },
  'Média': { colorVar: '--status-yellow' },
  'Baixa': { colorVar: '--status-green' },
};

interface Props {
  insight: ExamInsight;
  index: number;
}

export function CopilotExamCard({ insight, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { exam: e } = insight;
  const cfg = examStatusConfig[e.status] ?? examStatusConfig['Pendente'];
  const impCfg = importanceConfig[e.importance] ?? importanceConfig['Baixa'];
  const statusColor = `hsl(var(${cfg.colorVar}))`;

  const glowStyle = e.status === 'Atrasado' ? {
    borderColor: `hsl(var(--status-red) / 0.25)`,
    boxShadow: `0 0 24px -6px hsl(var(--status-red) / 0.12)`,
  } : e.status === 'Próximo' ? {
    borderColor: `hsl(var(--status-yellow) / 0.2)`,
    boxShadow: `0 0 20px -6px hsl(var(--status-yellow) / 0.1)`,
  } : {};

  return (
    <motion.div
      layout
      className={`glass-card rounded-xl overflow-hidden transition-all ${expanded ? 'ring-1 ring-primary/30' : ''}`}
      style={glowStyle}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 lg:p-5 text-left hover:bg-accent/30 transition-colors"
      >
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${statusColor.replace(')', ' / 0.12)')}` }}
        >
          <ClipboardCheck className="w-5 h-5" style={{ color: statusColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{e.name}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: `${statusColor.replace(')', ' / 0.12)')}`,
                color: statusColor,
              }}
            >
              {cfg.label}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline"
              style={{
                backgroundColor: `hsl(var(${impCfg.colorVar}) / 0.1)`,
                color: `hsl(var(${impCfg.colorVar}))`,
              }}
            >
              {e.importance}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate leading-relaxed">{insight.interpretation}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground font-medium">{e.category}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{e.suggestedFrequency}</p>
        </div>

        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 p-4 lg:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <DetailItem icon={Stethoscope} label="Médico" value={e.doctor || 'Não informado'} />
                <DetailItem icon={ShieldAlert} label="Perigo" value={e.mainRisk} />
                <DetailItem icon={FileText} label="Tipo" value={e.type} />
                <DetailItem icon={CalendarDays} label="Última Data" value={e.lastDate ? new Date(e.lastDate).toLocaleDateString('pt-BR') : '—'} />
                <DetailItem icon={CalendarDays} label="Próxima Data" value={e.nextDate ? new Date(e.nextDate).toLocaleDateString('pt-BR') : '—'} />
                {e.resultSummary && <DetailItem icon={ClipboardCheck} label="Resultado" value={e.resultSummary} />}
              </div>

              {/* Next step */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Próximo passo</p>
                  <p className="text-sm leading-relaxed">{insight.nextStep}</p>
                </div>
              </div>

              {/* Doctor question */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-secondary/50 border border-border/30">
                <MessageCircleQuestion className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Pergunta para o médico</p>
                  <p className="text-sm leading-relaxed italic">"{insight.doctorQuestion}"</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Stethoscope; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-secondary/80 flex items-center justify-center mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="text-sm font-medium mt-0.5 leading-snug">{value}</p>
      </div>
    </div>
  );
}