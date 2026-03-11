import { HealthData, Status } from '@/types/health';
import { X } from 'lucide-react';

interface DomainDetail {
  biomarkerIds: string[];
  examNames: string[];
}

const domainDetails: Record<string, DomainDetail> = {
  cardiovascular: {
    biomarkerIds: ['pa-sys', 'pa-dia', 'ldl', 'hdl', 'trig', 'pcr', 'apob'],
    examNames: ['Eletrocardiograma', 'Teste Ergométrico', 'Score de Cálcio Coronariano'],
  },
  metabolic: {
    biomarkerIds: ['glicemia', 'hba1c', 'insulina', 'imc', 'cintura', 'trig'],
    examNames: [],
  },
  liver: {
    biomarkerIds: ['tgo', 'tgp', 'ggt'],
    examNames: ['Ultrassom Abdominal'],
  },
  kidney: {
    biomarkerIds: ['creatinina', 'ureia'],
    examNames: ['Urina Tipo 1', 'Microalbuminúria'],
  },
  hormonal: {
    biomarkerIds: ['tsh', 't4livre', 'testosterona'],
    examNames: [],
  },
  nutrition: {
    biomarkerIds: ['vitd', 'vitb12', 'ferritina'],
    examNames: [],
  },
  preventive: {
    biomarkerIds: [],
    examNames: [], // handled specially — shows all exams
  },
};

const statusDot = (s: Status) => `hsl(var(--status-${s === 'unknown' ? 'yellow' : s}))`;

interface Props {
  domainId: string;
  label: string;
  score: number;
  status: Status;
  summary: string;
  data: HealthData;
  onClose: () => void;
}

export function DomainDetailPanel({ domainId, label, score, status, summary, data, onClose }: Props) {
  const detail = domainDetails[domainId];
  if (!detail) return null;

  const biomarkers = detail.biomarkerIds
    .map(id => data.biomarkers.find(b => b.id === id))
    .filter(Boolean);

  const isPreventive = domainId === 'preventive';
  const exams = isPreventive
    ? data.exams
    : detail.examNames.map(name => data.exams.find(e => e.name === name)).filter(Boolean);

  return (
    <div className="glass-card rounded-xl p-5 animate-enter">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">{label}</h3>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono"
            style={{
              color: `hsl(var(--status-${status}))`,
              backgroundColor: `hsl(var(--status-${status}) / 0.15)`,
            }}
          >
            {score}/100
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{summary}</p>

      {/* Biomarkers */}
      {biomarkers.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Biomarcadores</p>
          <div className="space-y-1.5">
            {biomarkers.map(b => b && (
              <div key={b.id} className="flex items-center justify-between text-sm bg-secondary/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusDot(b.status) }} />
                  <span className="text-muted-foreground">{b.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">{b.value ?? '—'} {b.unit}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    b.status === 'green' ? 'bg-status-green status-green' :
                    b.status === 'yellow' ? 'bg-status-yellow status-yellow' :
                    b.status === 'red' ? 'bg-status-red status-red' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {b.status === 'green' ? 'OK' : b.status === 'yellow' ? 'Atenção' : b.status === 'red' ? 'Ação' : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exams */}
      {exams.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {isPreventive ? 'Todos os Exames' : 'Exames Relacionados'}
          </p>
          <div className="space-y-1.5">
            {exams.map(e => e && (
              <div key={e.id} className="flex items-center justify-between text-sm bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-muted-foreground truncate mr-2">{e.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                  e.status === 'Em dia' ? 'bg-status-green status-green' :
                  e.status === 'Atrasado' ? 'bg-status-red status-red' :
                  'bg-status-yellow status-yellow'
                }`}>
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
