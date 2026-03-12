import { useHealth } from '@/contexts/HealthContext';
import { Status } from '@/types/health';
import { GridPageSkeleton } from '@/components/skeletons/DashboardSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';
import { Shield, Activity, Droplets, Brain, Eye, Scan, Heart, Pill } from 'lucide-react';

const riskGroups = [
  { label: 'Cardiovascular', icon: Heart, biomarkerIds: ['pa-sys', 'pa-dia', 'ldl', 'hdl', 'trig', 'pcr', 'apob'], examNames: ['Eletrocardiograma', 'Teste Ergométrico', 'Ecocardiograma', 'Score de Cálcio Coronariano'] },
  { label: 'Metabolismo', icon: Activity, biomarkerIds: ['glicemia', 'hba1c', 'insulina', 'imc', 'cintura', 'ferritina', 'vitb12'], examNames: ['Glicemia em Jejum', 'Hemoglobina Glicada', 'Bioimpedância Corporal'] },
  { label: 'Fígado', icon: Pill, biomarkerIds: ['tgo', 'tgp', 'ggt'], examNames: ['Ultrassom Abdominal'] },
  { label: 'Rins', icon: Droplets, biomarkerIds: ['creatinina', 'ureia'], examNames: ['Urina Tipo 1', 'Microalbuminúria'] },
  { label: 'Hormonal', icon: Brain, biomarkerIds: ['tsh', 't4livre', 'testosterona', 'vitd'], examNames: ['TSH', 'T4 Livre'] },
  { label: 'Urologia', icon: Shield, biomarkerIds: ['psa'], examNames: ['PSA'] },
  { label: 'Pele', icon: Scan, biomarkerIds: [], examNames: ['Consulta Dermatológica'] },
  { label: 'Visão', icon: Eye, biomarkerIds: [], examNames: ['Consulta Oftalmológica'] },
];

const statusConfig: Record<Status, { dot: string; label: string; badge: string }> = {
  green: { dot: 'bg-[hsl(var(--status-green))]', label: 'OK', badge: 'bg-[hsl(var(--status-green)/0.12)] text-[hsl(var(--status-green))]' },
  yellow: { dot: 'bg-[hsl(var(--status-yellow))]', label: 'Atenção', badge: 'bg-[hsl(var(--status-yellow)/0.12)] text-[hsl(var(--status-yellow))]' },
  red: { dot: 'bg-[hsl(var(--status-red))]', label: 'Ação', badge: 'bg-[hsl(var(--status-red)/0.12)] text-[hsl(var(--status-red))]' },
  unknown: { dot: 'bg-muted-foreground', label: 'Sem Dados', badge: 'bg-secondary text-muted-foreground' },
};

const Riscos = () => {
  const { data, loading, error, retry } = useHealth();

  const getGroupStatus = (group: typeof riskGroups[0]): Status => {
    const statuses: Status[] = [];
    group.biomarkerIds.forEach(id => {
      const b = data.biomarkers.find(bm => bm.id === id);
      if (b) statuses.push(b.status);
    });
    group.examNames.forEach(name => {
      const e = data.exams.find(ex => ex.name === name);
      if (e) {
        if (e.status === 'Atrasado') statuses.push('red');
        else if (e.status === 'Pendente') statuses.push('yellow');
        else statuses.push('green');
      }
    });
    if (statuses.includes('red')) return 'red';
    if (statuses.includes('yellow')) return 'yellow';
    if (statuses.length === 0) return 'unknown';
    return 'green';
  };

  // Summary counts
  const groupStatuses = riskGroups.map(g => getGroupStatus(g));
  const okCount = groupStatuses.filter(s => s === 'green').length;
  const attentionCount = groupStatuses.filter(s => s === 'yellow').length;
  const actionCount = groupStatuses.filter(s => s === 'red').length;

  if (loading) return <GridPageSkeleton cards={8} />;

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Mapa de Riscos</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão consolidada por área de saúde</p>
      </div>

      {/* Summary */}
      <StaggerContainer className="grid grid-cols-3 gap-3">
        {[
          { value: okCount, label: 'Normal', className: 'text-[hsl(var(--status-green))]' },
          { value: attentionCount, label: 'Atenção', className: 'text-[hsl(var(--status-yellow))]' },
          { value: actionCount, label: 'Ação', className: 'text-[hsl(var(--status-red))]' },
        ].map(s => (
          <StaggerItem key={s.label}>
            <div className="glass-card p-4 text-center">
              <p className={`display-number text-2xl ${s.className}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskGroups.map(group => {
          const groupStatus = getGroupStatus(group);
          const config = statusConfig[groupStatus];
          const Icon = group.icon;
          
          const biomarkers = group.biomarkerIds.map(id => data.biomarkers.find(b => b.id === id)).filter(Boolean);
          const exams = group.examNames.map(name => data.exams.find(e => e.name === name)).filter(Boolean);

          return (
            <StaggerItem key={group.label}>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-secondary/80 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-foreground/70" />
                  </div>
                  <h3 className="font-semibold text-sm">{group.label}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${config.badge}`}>
                  {config.label}
                </span>
              </div>
              <div className="space-y-2">
                {biomarkers.map(b => b && (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs tabular-nums">{b.value ?? '—'} {b.unit}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[b.status].dot}`} />
                    </div>
                  </div>
                ))}
                {exams.map(e => e && (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">{e.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium">{e.status}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        e.status === 'Em dia' ? 'bg-[hsl(var(--status-green))]' :
                        e.status === 'Atrasado' ? 'bg-[hsl(var(--status-red))]' : 'bg-[hsl(var(--status-yellow))]'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Lifestyle */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-sm mb-4">Estilo de Vida</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Exercício', value: `${data.lifestyle.exerciseFrequency}x`, suffix: '/sem' },
            { label: 'Sono', value: `${data.lifestyle.sleepHours}h`, suffix: '/noite' },
            { label: 'Tabagismo', value: data.lifestyle.smokingStatus === 'never' ? 'Nunca' : data.lifestyle.smokingStatus === 'former' ? 'Ex' : 'Sim', suffix: '' },
            { label: 'Álcool', value: `${data.lifestyle.alcoholWeekly}`, suffix: ' doses/sem' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
              <p className="display-number text-lg">{item.value}<span className="text-xs text-muted-foreground font-normal">{item.suffix}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Riscos;
