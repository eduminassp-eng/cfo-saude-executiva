import { HealthData, Status } from '@/types/health';
import { useMemo, useState } from 'react';
import {
  Heart, Flame, Droplets, Bean, Zap, Eye, Shield, Dumbbell, Stethoscope,
  ChevronDown, AlertTriangle, Lightbulb, ArrowRight,
} from 'lucide-react';

interface RiskDomain {
  id: string;
  label: string;
  icon: typeof Heart;
  score: number;
  status: Status;
  explanation: string;
  mainDriver: string;
  nextStep: string;
}

function statusScore(s: Status): number {
  return s === 'green' ? 1 : s === 'yellow' ? 0.5 : s === 'red' ? 0 : 0.3;
}

function getBioStatus(data: HealthData, id: string): Status {
  return data.biomarkers.find(b => b.id === id)?.status ?? 'unknown';
}

function examDone(data: HealthData, name: string): boolean {
  const e = data.exams.find(ex => ex.name === name);
  return e?.status === 'Em dia' || e?.status === 'Próximo';
}

function examStatus(data: HealthData, name: string): Status {
  const e = data.exams.find(ex => ex.name === name);
  if (!e) return 'unknown';
  if (e.status === 'Em dia') return 'green';
  if (e.status === 'Próximo') return 'yellow';
  if (e.status === 'Atrasado') return 'red';
  return 'unknown';
}

function avg(vals: number[]): number {
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function clamp(v: number, min: number, max: number) {
  return Math.round(Math.max(min, Math.min(max, v)));
}

function toStatus(score: number, hasData: boolean): Status {
  if (!hasData) return 'unknown';
  return score >= 75 ? 'green' : score >= 50 ? 'yellow' : 'red';
}

function worstBiomarker(data: HealthData, ids: string[]): string {
  let worst: { id: string; score: number } | null = null;
  for (const id of ids) {
    const s = statusScore(getBioStatus(data, id));
    if (worst === null || s < worst.score) worst = { id, score: s };
  }
  if (!worst) return '';
  return data.biomarkers.find(b => b.id === worst!.id)?.name ?? '';
}

function buildRiskDomains(data: HealthData): RiskDomain[] {
  const ss = (id: string) => statusScore(getBioStatus(data, id));
  const domains: RiskDomain[] = [];

  // Cardiovascular
  const cardioIds = ['pa-sys', 'pa-dia', 'ldl', 'hdl', 'trig', 'pcr', 'apob'];
  const cardioFactors = cardioIds.map(ss);
  const cardioExams = [examDone(data, 'Eletrocardiograma'), examDone(data, 'Teste Ergométrico'), examDone(data, 'Score de Cálcio Coronariano')];
  const cardioExamPct = cardioExams.filter(Boolean).length / cardioExams.length;
  const cardioScore = clamp(Math.round((avg(cardioFactors) * 0.75 + cardioExamPct * 0.25) * 100), 0, 100);
  const cardioIssues = cardioIds.filter(id => getBioStatus(data, id) !== 'green' && getBioStatus(data, id) !== 'unknown');
  domains.push({
    id: 'cardiovascular', label: 'Cardiovascular', icon: Heart, score: cardioScore,
    status: toStatus(cardioScore, true),
    explanation: cardioScore >= 75 ? 'Perfil cardiovascular controlado e dentro dos parâmetros recomendados.' : cardioIssues.length > 0 ? `${cardioIssues.length} marcador(es) cardiovascular(es) fora da faixa ideal.` : 'Exames cardiovasculares pendentes — dados insuficientes.',
    mainDriver: worstBiomarker(data, cardioIds) || 'Exames pendentes',
    nextStep: cardioScore >= 75 ? 'Manter hábitos e repetir perfil lipídico em 12 meses.' : 'Avaliar perfil lipídico e pressórico com cardiologista.',
  });

  // Metabolic
  const metabIds = ['glicemia', 'hba1c', 'insulina', 'imc', 'cintura', 'trig'];
  const metabFactors = metabIds.map(ss);
  const metabScore = clamp(Math.round(avg(metabFactors) * 100), 0, 100);
  const metabIssues = metabIds.filter(id => getBioStatus(data, id) !== 'green' && getBioStatus(data, id) !== 'unknown');
  domains.push({
    id: 'metabolic', label: 'Metabólico', icon: Flame, score: metabScore,
    status: toStatus(metabScore, true),
    explanation: metabScore >= 75 ? 'Metabolismo equilibrado, sem sinais de resistência insulínica.' : `${metabIssues.length} indicador(es) metabólico(s) merecem acompanhamento.`,
    mainDriver: worstBiomarker(data, metabIds) || 'Dados incompletos',
    nextStep: metabScore >= 75 ? 'Manter dieta equilibrada e atividade física regular.' : 'Priorizar controle glicêmico e composição corporal.',
  });

  // Liver
  const liverIds = ['tgo', 'tgp', 'ggt'];
  const liverFactors = liverIds.map(ss);
  const liverExam = examDone(data, 'Ultrassom Abdominal');
  const liverScore = clamp(Math.round((avg(liverFactors) * 0.8 + (liverExam ? 1 : 0) * 0.2) * 100), 0, 100);
  domains.push({
    id: 'liver', label: 'Fígado', icon: Droplets, score: liverScore,
    status: toStatus(liverScore, true),
    explanation: liverScore >= 75 ? 'Enzimas hepáticas normais, função hepática preservada.' : 'Enzimas hepáticas alteradas — investigar hábitos e solicitar ultrassom.',
    mainDriver: worstBiomarker(data, liverIds) || 'Ultrassom pendente',
    nextStep: liverScore >= 75 ? 'Repetir enzimas hepáticas no próximo check-up.' : 'Realizar ultrassom abdominal e reduzir álcool/gordura.',
  });

  // Kidney
  const kidneyIds = ['creatinina', 'ureia'];
  const kidneyFactors = kidneyIds.map(ss);
  const kidneyExams = [examDone(data, 'Urina Tipo 1'), examDone(data, 'Microalbuminúria')];
  const kidneyExamPct = kidneyExams.filter(Boolean).length / kidneyExams.length;
  const kidneyScore = clamp(Math.round((avg(kidneyFactors) * 0.7 + kidneyExamPct * 0.3) * 100), 0, 100);
  domains.push({
    id: 'kidney', label: 'Rins', icon: Bean, score: kidneyScore,
    status: toStatus(kidneyScore, true),
    explanation: kidneyScore >= 75 ? 'Função renal preservada, creatinina e ureia normais.' : 'Indicadores renais alterados — monitorar com nefrologista.',
    mainDriver: worstBiomarker(data, kidneyIds) || 'Exames renais pendentes',
    nextStep: kidneyScore >= 75 ? 'Manter hidratação adequada e repetir exames anualmente.' : 'Solicitar clearance de creatinina e consulta nefrológica.',
  });

  // Hormonal
  const hormonalIds = ['tsh', 't4livre', 'testosterona'];
  const hormonalFactors = hormonalIds.map(ss);
  const hormonalScore = clamp(Math.round(avg(hormonalFactors) * 100), 0, 100);
  domains.push({
    id: 'hormonal', label: 'Hormonal', icon: Zap, score: hormonalScore,
    status: toStatus(hormonalScore, true),
    explanation: hormonalScore >= 75 ? 'Tireoide e hormônios dentro da faixa ideal.' : 'Perfil hormonal com alterações — avaliar com endocrinologista.',
    mainDriver: worstBiomarker(data, hormonalIds) || 'Dosagens pendentes',
    nextStep: hormonalScore >= 75 ? 'Repetir painel hormonal em 12 meses.' : 'Consultar endocrinologista para avaliação detalhada.',
  });

  // Urology
  const psaStatus = getBioStatus(data, 'psa');
  const psaExam = examStatus(data, 'PSA');
  const hasUroData = psaStatus !== 'unknown' || psaExam !== 'unknown';
  const uroFactors = [psaStatus !== 'unknown' ? statusScore(psaStatus) : -1, psaExam !== 'unknown' ? statusScore(psaExam) : -1].filter(v => v >= 0);
  const uroScore = uroFactors.length > 0 ? clamp(Math.round(avg(uroFactors) * 100), 0, 100) : 0;
  domains.push({
    id: 'urology', label: 'Urologia', icon: Stethoscope, score: uroScore,
    status: toStatus(uroScore, hasUroData),
    explanation: !hasUroData ? 'Dados insuficientes para avaliar saúde urológica.' : uroScore >= 75 ? 'PSA dentro da normalidade e acompanhamento em dia.' : 'PSA ou exame urológico requer atenção.',
    mainDriver: !hasUroData ? 'PSA não realizado' : psaStatus !== 'green' ? 'PSA' : 'Consulta urológica',
    nextStep: !hasUroData ? 'Realizar PSA e consulta com urologista.' : uroScore >= 75 ? 'Manter acompanhamento anual com urologista.' : 'Agendar consulta urológica para investigação.',
  });

  // Dermatology
  const dermaExam = examStatus(data, 'Consulta Dermatológica');
  const hasDermaData = dermaExam !== 'unknown';
  const dermaScore = hasDermaData ? clamp(Math.round(statusScore(dermaExam) * 100), 0, 100) : 0;
  domains.push({
    id: 'dermatology', label: 'Dermatologia', icon: Shield, score: dermaScore,
    status: toStatus(dermaScore, hasDermaData),
    explanation: !hasDermaData ? 'Consulta dermatológica ainda não registrada.' : dermaScore >= 75 ? 'Avaliação dermatológica em dia.' : 'Consulta dermatológica atrasada — rastreamento de lesões cutâneas pendente.',
    mainDriver: !hasDermaData ? 'Sem registro' : dermaScore >= 75 ? 'Rastreamento em dia' : 'Consulta atrasada',
    nextStep: !hasDermaData || dermaScore < 75 ? 'Agendar consulta dermatológica para mapeamento de nevos.' : 'Manter avaliação anual.',
  });

  // Ophthalmology
  const oftalExam = examStatus(data, 'Consulta Oftalmológica');
  const hasOftalData = oftalExam !== 'unknown';
  const oftalScore = hasOftalData ? clamp(Math.round(statusScore(oftalExam) * 100), 0, 100) : 0;
  domains.push({
    id: 'ophthalmology', label: 'Oftalmologia', icon: Eye, score: oftalScore,
    status: toStatus(oftalScore, hasOftalData),
    explanation: !hasOftalData ? 'Avaliação oftalmológica não registrada.' : oftalScore >= 75 ? 'Exame oftalmológico em dia — rastreamento de glaucoma atualizado.' : 'Consulta oftalmológica atrasada — risco de detecção tardia.',
    mainDriver: !hasOftalData ? 'Sem registro' : oftalScore >= 75 ? 'Rastreamento em dia' : 'Consulta atrasada',
    nextStep: !hasOftalData || oftalScore < 75 ? 'Agendar consulta oftalmológica com tonometria.' : 'Manter acompanhamento anual.',
  });

  // Lifestyle
  const ls = data.lifestyle;
  const exScore = ls.exerciseFrequency >= 5 ? 1 : ls.exerciseFrequency >= 3 ? 0.7 : ls.exerciseFrequency >= 1 ? 0.4 : 0;
  const sleepScore = ls.sleepHours >= 7 && ls.sleepHours <= 9 ? 1 : ls.sleepHours >= 6 ? 0.6 : 0.3;
  const smokeScore = ls.smokingStatus === 'never' ? 1 : ls.smokingStatus === 'former' ? 0.7 : 0;
  const alcScore = ls.alcoholWeekly <= 3 ? 1 : ls.alcoholWeekly <= 7 ? 0.7 : ls.alcoholWeekly <= 14 ? 0.4 : 0;
  const stepsScore = ls.dailySteps >= 8000 ? 1 : ls.dailySteps >= 5000 ? 0.7 : ls.dailySteps > 0 ? 0.3 : 0.5;
  const lifestyleFactors = [exScore, sleepScore, smokeScore, alcScore, stepsScore];
  const lifestyleScore = clamp(Math.round(avg(lifestyleFactors) * 100), 0, 100);

  const worstLifestyle = [
    { label: 'Exercício físico', score: exScore },
    { label: 'Qualidade do sono', score: sleepScore },
    { label: 'Tabagismo', score: smokeScore },
    { label: 'Consumo de álcool', score: alcScore },
    { label: 'Passos diários', score: stepsScore },
  ].sort((a, b) => a.score - b.score)[0];

  domains.push({
    id: 'lifestyle', label: 'Estilo de Vida', icon: Dumbbell, score: lifestyleScore,
    status: toStatus(lifestyleScore, true),
    explanation: lifestyleScore >= 75 ? 'Hábitos saudáveis bem estabelecidos — sono, exercício e alimentação equilibrados.' : `Estilo de vida com oportunidades de melhora em ${worstLifestyle.label.toLowerCase()}.`,
    mainDriver: worstLifestyle.label,
    nextStep: lifestyleScore >= 75 ? 'Manter rotina e monitorar consistência ao longo do tempo.' : `Focar em melhorar ${worstLifestyle.label.toLowerCase()} como prioridade.`,
  });

  return domains;
}

const statusLabels: Record<Status, string> = {
  green: 'Controlado',
  yellow: 'Atenção',
  red: 'Ação necessária',
  unknown: 'Dados insuficientes',
};

interface Props {
  data: HealthData;
}

export function HealthRiskMap({ data }: Props) {
  const domains = useMemo(() => buildRiskDomains(data), [data]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Status | null>(null);

  const greenCount = domains.filter(d => d.status === 'green').length;
  const yellowCount = domains.filter(d => d.status === 'yellow').length;
  const redCount = domains.filter(d => d.status === 'red').length;
  const grayCount = domains.filter(d => d.status === 'unknown').length;

  const filteredDomains = activeFilter ? domains.filter(d => d.status === activeFilter) : domains;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Mapa de Riscos por Sistema</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Visão consolidada da saúde por domínio clínico</p>
        </div>
        <div className="flex gap-2">
          {[
            { count: greenCount, colorVar: '--status-green', label: 'OK' },
            { count: yellowCount, colorVar: '--status-yellow', label: 'Atenção' },
            { count: redCount, colorVar: '--status-red', label: 'Ação' },
            { count: grayCount, colorVar: '--muted-foreground', label: 'S/dados' },
          ].filter(b => b.count > 0).map(b => (
            <span
              key={b.label}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ color: `hsl(var(${b.colorVar}))`, backgroundColor: `hsl(var(${b.colorVar}) / 0.12)` }}
            >
              {b.count} {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Domain Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {domains.map((d, idx) => {
          const isExpanded = expandedId === d.id;
          const colorVar = d.status === 'green' ? '--status-green' : d.status === 'yellow' ? '--status-yellow' : d.status === 'red' ? '--status-red' : '--muted-foreground';
          const Icon = d.icon;

          return (
            <div key={d.id} className={isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                className={`glass-card rounded-xl w-full text-left transition-all hover:bg-accent/20 animate-fade-in ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: `hsl(var(${colorVar}) / 0.12)` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: `hsl(var(${colorVar}))` }} />
                      </div>
                      <span className="text-sm font-medium">{d.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold font-mono px-2 py-0.5 rounded-full"
                        style={{ color: `hsl(var(${colorVar}))`, backgroundColor: `hsl(var(${colorVar}) / 0.12)` }}
                      >
                        {d.status === 'unknown' ? '—' : d.score}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-secondary mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: d.status === 'unknown' ? '0%' : `${d.score}%`,
                        backgroundColor: `hsl(var(${colorVar}))`,
                      }}
                    />
                  </div>

                  {/* Status label + explanation */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{d.explanation}</p>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0"
                      style={{ color: `hsl(var(${colorVar}))`, backgroundColor: `hsl(var(${colorVar}) / 0.08)` }}
                    >
                      {statusLabels[d.status]}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/30 px-4 pb-4 pt-3 space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: 'hsl(var(--status-red) / 0.04)', border: '1px solid hsl(var(--status-red) / 0.1)' }}>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" style={{ color: 'hsl(var(--status-red))' }} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Principal fator de risco</span>
                        </div>
                        <p className="text-xs font-medium">{d.mainDriver}</p>
                      </div>
                      <div className="rounded-lg p-3 space-y-1" style={{ backgroundColor: 'hsl(var(--status-green) / 0.04)', border: '1px solid hsl(var(--status-green) / 0.1)' }}>
                        <div className="flex items-center gap-1.5">
                          <Lightbulb className="w-3 h-3" style={{ color: 'hsl(var(--status-green))' }} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Próximo passo recomendado</span>
                        </div>
                        <p className="text-xs font-medium">{d.nextStep}</p>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
