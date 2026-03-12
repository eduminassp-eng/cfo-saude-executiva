import { useHealth } from '@/contexts/HealthContext';
import { Status } from '@/types/health';
import { PageTransition } from '@/components/motion/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerContainer';

const riskGroups = [
  { label: 'Cardiovascular', biomarkerIds: ['pa-sys', 'pa-dia', 'ldl', 'hdl', 'trig', 'pcr', 'apob'], examNames: ['Eletrocardiograma', 'Teste Ergométrico', 'Ecocardiograma', 'Score de Cálcio Coronariano'] },
  { label: 'Metabolismo', biomarkerIds: ['glicemia', 'hba1c', 'insulina', 'imc', 'cintura', 'ferritina', 'vitb12'], examNames: ['Glicemia em Jejum', 'Hemoglobina Glicada', 'Bioimpedância Corporal'] },
  { label: 'Fígado', biomarkerIds: ['tgo', 'tgp', 'ggt'], examNames: ['Ultrassom Abdominal'] },
  { label: 'Rins', biomarkerIds: ['creatinina', 'ureia'], examNames: ['Urina Tipo 1', 'Microalbuminúria'] },
  { label: 'Hormonal', biomarkerIds: ['tsh', 't4livre', 'testosterona', 'vitd'], examNames: ['TSH', 'T4 Livre'] },
  { label: 'Urologia', biomarkerIds: ['psa'], examNames: ['PSA'] },
  { label: 'Pele', biomarkerIds: [], examNames: ['Consulta Dermatológica'] },
  { label: 'Visão', biomarkerIds: [], examNames: ['Consulta Oftalmológica'] },
];

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  green: { bg: 'bg-status-green', text: 'status-green', label: 'OK' },
  yellow: { bg: 'bg-status-yellow', text: 'status-yellow', label: 'Atenção' },
  red: { bg: 'bg-status-red', text: 'status-red', label: 'Ação Necessária' },
  unknown: { bg: 'bg-secondary', text: 'text-muted-foreground', label: 'Sem Dados' },
};

const Riscos = () => {
  const { data } = useHealth();

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

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Mapa de Riscos</h1>
        <p className="text-muted-foreground mt-1">Visão consolidada por área de saúde</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskGroups.map(group => {
          const groupStatus = getGroupStatus(group);
          const config = statusConfig[groupStatus];
          
          const biomarkers = group.biomarkerIds.map(id => data.biomarkers.find(b => b.id === id)).filter(Boolean);
          const exams = group.examNames.map(name => data.exams.find(e => e.name === name)).filter(Boolean);

          return (
            <StaggerItem key={group.label}>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{group.label}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              </div>
              <div className="space-y-2">
                {biomarkers.map(b => b && (
                  <div key={b.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{b.value ?? '—'} {b.unit}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        b.status === 'green' ? 'bg-status-green status-green' :
                        b.status === 'yellow' ? 'bg-status-yellow status-yellow' :
                        b.status === 'red' ? 'bg-status-red status-red' : 'bg-secondary'
                      }`} style={{ backgroundColor: `hsl(var(--status-${b.status === 'unknown' ? 'yellow' : b.status}))` }} />
                    </div>
                  </div>
                ))}
                {exams.map(e => e && (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{e.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{e.status}</span>
                      <div className={`w-2 h-2 rounded-full`} style={{
                        backgroundColor: e.status === 'Em dia' ? 'hsl(var(--status-green))' :
                          e.status === 'Atrasado' ? 'hsl(var(--status-red))' : 'hsl(var(--status-yellow))'
                      }} />
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
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold mb-4">Estilo de Vida</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Exercício</p>
            <p className="font-mono text-lg">{data.lifestyle.exerciseFrequency}x<span className="text-xs text-muted-foreground">/sem</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sono</p>
            <p className="font-mono text-lg">{data.lifestyle.sleepHours}h<span className="text-xs text-muted-foreground">/noite</span></p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tabagismo</p>
            <p className="text-sm font-medium">{data.lifestyle.smokingStatus === 'never' ? 'Nunca' : data.lifestyle.smokingStatus === 'former' ? 'Ex-fumante' : 'Fumante'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Álcool</p>
            <p className="font-mono text-lg">{data.lifestyle.alcoholWeekly}<span className="text-xs text-muted-foreground"> doses/sem</span></p>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Riscos;
