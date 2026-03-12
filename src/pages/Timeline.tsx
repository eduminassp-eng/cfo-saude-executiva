import { useHealth } from '@/contexts/HealthContext';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { PageTransition } from '@/components/motion/PageTransition';

const Timeline = () => {
  const { data } = useHealth();

  const overdue = data.exams.filter(e => e.status === 'Atrasado').sort((a, b) => (a.nextDate ?? '').localeCompare(b.nextDate ?? ''));
  const upcoming = data.exams.filter(e => e.status === 'Em dia' || e.status === 'Próximo').filter(e => e.nextDate).sort((a, b) => (a.nextDate!).localeCompare(b.nextDate!));
  const pending = data.exams.filter(e => e.status === 'Pendente');
  const completed = data.exams.filter(e => e.lastDate).sort((a, b) => (b.lastDate!).localeCompare(a.lastDate!)).slice(0, 10);

  const Section = ({ title, icon: Icon, items, iconClass }: { title: string; icon: typeof Calendar; items: typeof overdue; iconClass: string }) => (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
        <Icon className={`w-5 h-5 ${iconClass}`} /> {title}
        <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground glass-card rounded-lg p-4">Nenhum item.</p>
      ) : (
        <div className="space-y-2">
          {items.map(e => (
            <div key={e.id} className="glass-card rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.category} • {e.doctor || 'Sem médico'}</p>
              </div>
              <div className="text-right shrink-0">
                {e.nextDate && <p className="text-sm font-mono">{new Date(e.nextDate).toLocaleDateString('pt-BR')}</p>}
                {e.lastDate && !e.nextDate && <p className="text-sm font-mono">{new Date(e.lastDate).toLocaleDateString('pt-BR')}</p>}
                <p className="text-xs text-muted-foreground">{e.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <PageTransition>
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Timeline de Saúde</h1>
        <p className="text-muted-foreground mt-1">Visão cronológica dos seus exames e consultas</p>
      </div>
      <Section title="Atrasados" icon={AlertCircle} items={overdue} iconClass="status-red" />
      <Section title="Pendentes" icon={Clock} items={pending} iconClass="text-muted-foreground" />
      <Section title="Próximos Agendamentos" icon={Calendar} items={upcoming} iconClass="status-yellow" />
      <Section title="Últimos Realizados" icon={CheckCircle2} items={completed} iconClass="status-green" />
    </div>
    </PageTransition>
  );
};

export default Timeline;
