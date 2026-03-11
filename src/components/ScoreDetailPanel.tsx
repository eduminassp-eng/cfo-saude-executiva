import { HealthScore } from '@/types/health';
import { X } from 'lucide-react';

interface Props {
  type: 'cardiac' | 'metabolic' | 'longevity';
  score: HealthScore;
  onClose: () => void;
}

const titles = {
  cardiac: 'Score de Risco Cardíaco',
  metabolic: 'Score Metabólico',
  longevity: 'Score de Longevidade',
};

const descriptions = {
  cardiac: 'Avalia pressão arterial, perfil lipídico, marcadores inflamatórios, exames cardíacos e composição corporal.',
  metabolic: 'Avalia glicemia, resistência insulínica, função hepática, composição corporal e atividade física.',
  longevity: 'Combina os scores cardíaco e metabólico com adesão preventiva, sono, exercício e hábitos de vida.',
};

export function ScoreDetailPanel({ type, score, onClose }: Props) {
  return (
    <div className="glass-card rounded-xl p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{titles[type]}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{descriptions[type]}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {score.breakdown.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-0.5">
                <span className="font-medium truncate">{item.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{item.score}/{item.maxPoints}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.score / item.maxPoints) * 100}%`,
                    backgroundColor: item.score / item.maxPoints >= 0.7
                      ? 'hsl(var(--status-green))'
                      : item.score / item.maxPoints >= 0.4
                      ? 'hsl(var(--status-yellow))'
                      : 'hsl(var(--status-red))',
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
        <span className="text-sm font-medium">Total</span>
        <span className="text-xl font-bold font-mono">{score.value}<span className="text-sm text-muted-foreground">/100</span></span>
      </div>
    </div>
  );
}
