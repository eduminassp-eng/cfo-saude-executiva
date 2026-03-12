import { useHealth } from '@/contexts/HealthContext';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { motion } from 'framer-motion';
import { ListPageSkeleton } from '@/components/skeletons/DashboardSkeleton';

const Timeline = () => {
  const { data, loading } = useHealth();

  const overdue = data.exams.filter(e => e.status === 'Atrasado').sort((a, b) => (a.nextDate ?? '').localeCompare(b.nextDate ?? ''));
  const upcoming = data.exams.filter(e => e.status === 'Em dia' || e.status === 'Próximo').filter(e => e.nextDate).sort((a, b) => (a.nextDate!).localeCompare(b.nextDate!));
  const pending = data.exams.filter(e => e.status === 'Pendente');
  const completed = data.exams.filter(e => e.lastDate).sort((a, b) => (b.lastDate!).localeCompare(a.lastDate!)).slice(0, 10);

  const sections = [
    { title: 'Atrasados', icon: AlertCircle, items: overdue, iconClass: 'text-[hsl(var(--status-red))]', accentClass: 'border-l-[hsl(var(--status-red))]' },
    { title: 'Pendentes', icon: Clock, items: pending, iconClass: 'text-muted-foreground', accentClass: '' },
    { title: 'Próximos Agendamentos', icon: Calendar, items: upcoming, iconClass: 'text-[hsl(var(--status-yellow))]', accentClass: '' },
    { title: 'Últimos Realizados', icon: CheckCircle2, items: completed, iconClass: 'text-[hsl(var(--status-green))]', accentClass: '' },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Timeline de Saúde</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão cronológica dos seus exames e consultas</p>
      </div>

      {/* Summary cards */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: overdue.length, label: 'Atrasados', className: 'text-[hsl(var(--status-red))]' },
          { value: pending.length, label: 'Pendentes', className: 'text-muted-foreground' },
          { value: upcoming.length, label: 'Agendados', className: 'text-[hsl(var(--status-yellow))]' },
          { value: completed.length, label: 'Realizados', className: 'text-[hsl(var(--status-green))]' },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="glass-card p-4 text-center">
              <p className={`display-number text-2xl ${s.className}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {sections.map(({ title, icon: Icon, items, iconClass }) => (
        <div key={title}>
          <div className="flex items-center gap-2.5 mb-3">
            <Icon className={`w-5 h-5 ${iconClass}`} />
            <h2 className="text-base font-semibold">{title}</h2>
            <span className="text-xs text-muted-foreground font-medium bg-secondary/80 px-2 py-0.5 rounded-full">{items.length}</span>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground glass-card p-4">Nenhum item.</p>
          ) : (
            <div className="space-y-2">
              {items.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="glass-card p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.category} • {e.doctor || 'Sem médico'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {e.nextDate && <p className="text-sm font-mono tabular-nums">{new Date(e.nextDate).toLocaleDateString('pt-BR')}</p>}
                    {e.lastDate && !e.nextDate && <p className="text-sm font-mono tabular-nums">{new Date(e.lastDate).toLocaleDateString('pt-BR')}</p>}
                    <p className={`text-[10px] font-medium mt-0.5 ${
                      e.status === 'Atrasado' ? 'text-[hsl(var(--status-red))]' :
                      e.status === 'Em dia' ? 'text-[hsl(var(--status-green))]' :
                      e.status === 'Próximo' ? 'text-[hsl(var(--status-yellow))]' : 'text-muted-foreground'
                    }`}>{e.status}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
    </PageTransition>
  );
};

export default Timeline;
