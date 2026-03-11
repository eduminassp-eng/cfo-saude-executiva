import { Biomarker, Status } from '@/types/health';

function statusBadge(status: Status) {
  const map = {
    green: { bg: 'bg-status-green', text: 'status-green', label: 'Normal' },
    yellow: { bg: 'bg-status-yellow', text: 'status-yellow', label: 'Atenção' },
    red: { bg: 'bg-status-red', text: 'status-red', label: 'Ação' },
    unknown: { bg: 'bg-secondary', text: 'text-muted-foreground', label: '—' },
  };
  const s = map[status];
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

interface KPICardProps {
  biomarker: Biomarker;
  onClick?: () => void;
}

export function KPICard({ biomarker, onClick }: KPICardProps) {
  const rangeText = biomarker.targetMin !== null && biomarker.targetMax !== null
    ? `${biomarker.targetMin}–${biomarker.targetMax}`
    : biomarker.targetMax !== null
    ? `< ${biomarker.targetMax}`
    : biomarker.targetMin !== null
    ? `> ${biomarker.targetMin}`
    : '';

  return (
    <button
      onClick={onClick}
      className="glass-card-hover rounded-lg p-4 text-left w-full transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-muted-foreground font-medium truncate pr-2">{biomarker.name}</p>
        {statusBadge(biomarker.status)}
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-bold font-mono">{biomarker.value ?? '—'}</span>
        <span className="text-xs text-muted-foreground">{biomarker.unit}</span>
      </div>
      {rangeText && <p className="text-xs text-muted-foreground">Ref: {rangeText} {biomarker.unit}</p>}
      {biomarker.lastDate && (
        <p className="text-xs text-muted-foreground mt-1.5">
          Último: {new Date(biomarker.lastDate).toLocaleDateString('pt-BR')}
        </p>
      )}
      {biomarker.note && <p className="text-xs text-muted-foreground mt-1 italic">{biomarker.note}</p>}
    </button>
  );
}
