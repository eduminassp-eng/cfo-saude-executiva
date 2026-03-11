import { HealthData, Status } from '@/types/health';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from './scoring';
import { detectTrendPatterns } from './copilot';

export interface ScoreForecast {
  current: number;
  month3: number;
  month6: number;
  month12: number;
  status: Status;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ForecastResult {
  cardiac: ScoreForecast;
  metabolic: ScoreForecast;
  longevity: ScoreForecast;
  compliance: ScoreForecast;
  generatedAt: string;
  factors: ForecastFactor[];
}

export interface ForecastFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ForecastSummary {
  trajectory: 'improving' | 'stable' | 'declining';
  trajectoryLabel: string;
  trajectoryDescription: string;
  mainRisk: string;
  mainOpportunity: string;
  topNegativeDrivers: string[];
  topPositiveDrivers: string[];
}

export function buildForecastSummary(forecast: ForecastResult): ForecastSummary {
  const scores = [forecast.cardiac, forecast.metabolic, forecast.longevity, forecast.compliance];
  const avgDelta = scores.reduce((s, f) => s + (f.month12 - f.current), 0) / scores.length;

  const trajectory: ForecastSummary['trajectory'] =
    avgDelta > 2 ? 'improving' : avgDelta < -2 ? 'declining' : 'stable';

  const trajectoryMap = {
    improving: {
      label: 'Em melhora',
      description: 'Seus indicadores apontam para uma trajetória positiva nos próximos 12 meses. Manter os hábitos atuais é fundamental para consolidar essa evolução.',
    },
    stable: {
      label: 'Estável',
      description: 'Sua saúde projeta estabilidade para os próximos meses. Pequenos ajustes em hábitos podem transformar estabilidade em melhora consistente.',
    },
    declining: {
      label: 'Atenção necessária',
      description: 'Alguns indicadores mostram tendência de declínio. Intervenções pontuais agora podem reverter essa trajetória antes que se consolide.',
    },
  };

  // Identify main risk: the score with worst 12m projection
  const scoreLabels = { cardiac: 'Cardíaco', metabolic: 'Metabólico', longevity: 'Longevidade', compliance: 'Compliance Preventivo' } as const;
  const worstScore = (['cardiac', 'metabolic', 'longevity', 'compliance'] as const)
    .map(k => ({ key: k, val: forecast[k].month12 }))
    .sort((a, b) => a.val - b.val)[0];

  const riskMessages: Record<string, string> = {
    cardiac: 'O perfil cardiovascular é o ponto que mais demanda atenção. Priorize controle pressórico e lipídico.',
    metabolic: 'O metabolismo apresenta os indicadores mais sensíveis. Foco em alimentação equilibrada e atividade física regular.',
    longevity: 'O score de longevidade é o mais pressionado. Revisar hábitos de sono, exercício e adesão preventiva.',
    compliance: 'A adesão aos exames preventivos está abaixo do ideal. Agendar exames atrasados trará ganho imediato.',
  };

  // Best improvement opportunity: score with most room to grow
  const bestOpportunity = (['cardiac', 'metabolic', 'longevity', 'compliance'] as const)
    .map(k => ({ key: k, gap: 100 - forecast[k].current, delta: forecast[k].month12 - forecast[k].current }))
    .sort((a, b) => b.gap - a.gap)[0];

  const opportunityMessages: Record<string, string> = {
    cardiac: 'Melhorias no perfil lipídico e controle pressórico oferecem o maior potencial de ganho no score cardíaco.',
    metabolic: 'Ajustes em dieta e aumento de atividade física podem elevar significativamente o score metabólico.',
    longevity: 'Otimizar sono, exercício e manter exames em dia são as alavancas mais eficazes para longevidade.',
    compliance: 'Regularizar exames pendentes é a forma mais rápida de elevar seus scores gerais.',
  };

  const negDrivers = forecast.factors
    .filter(f => f.impact === 'negative')
    .slice(0, 3)
    .map(f => f.label);

  const posDrivers = forecast.factors
    .filter(f => f.impact === 'positive')
    .slice(0, 3)
    .map(f => f.label);

  return {
    trajectory,
    trajectoryLabel: trajectoryMap[trajectory].label,
    trajectoryDescription: trajectoryMap[trajectory].description,
    mainRisk: riskMessages[worstScore.key],
    mainOpportunity: opportunityMessages[bestOpportunity.key],
    topNegativeDrivers: negDrivers,
    topPositiveDrivers: posDrivers,
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.round(Math.max(min, Math.min(max, v)));
}

function calcComplianceScore(data: HealthData): number {
  const total = data.exams.length;
  if (total === 0) return 0;
  const upToDate = data.exams.filter(e => e.status === 'Em dia').length;
  const upcoming = data.exams.filter(e => e.status === 'Próximo').length;
  const pending = data.exams.filter(e => e.status === 'Pendente').length;
  return Math.round(((upToDate * 1 + upcoming * 0.75 + pending * 0.25) / total) * 100);
}

export function generateForecast(data: HealthData): ForecastResult {
  const cardiac = calcCardiacScore(data).value;
  const metabolic = calcMetabolicScore(data).value;
  const longevity = calcLongevityScore(data).value;
  const compliance = calcComplianceScore(data);

  const patterns = detectTrendPatterns(data);
  const factors: ForecastFactor[] = [];

  // Calculate trend momentum from biomarker patterns
  let biomarkerMomentum = 0;
  let biomarkerCount = 0;
  for (const p of patterns) {
    if (p.severity === 'negative') {
      biomarkerMomentum -= Math.min(Math.abs(p.changePercent) * 0.15, 4);
      biomarkerCount++;
    } else if (p.severity === 'positive') {
      biomarkerMomentum += Math.min(Math.abs(p.changePercent) * 0.1, 3);
      biomarkerCount++;
    }
  }
  if (biomarkerCount > 0) biomarkerMomentum /= biomarkerCount;

  // Lifestyle modifier
  let lifestyleMod = 0;
  const ls = data.lifestyle;
  if (ls.exerciseFrequency >= 4) { lifestyleMod += 1.5; factors.push({ label: 'Exercício regular', impact: 'positive', description: `${ls.exerciseFrequency}x/semana favorece melhora gradual dos scores.` }); }
  else if (ls.exerciseFrequency <= 1) { lifestyleMod -= 1; factors.push({ label: 'Sedentarismo', impact: 'negative', description: 'Baixa atividade física tende a deteriorar indicadores metabólicos.' }); }

  if (ls.sleepHours >= 7 && ls.sleepHours <= 9) { lifestyleMod += 0.5; }
  else if (ls.sleepHours < 6) { lifestyleMod -= 1; factors.push({ label: 'Sono insuficiente', impact: 'negative', description: 'Menos de 6h de sono impacta negativamente recuperação e metabolismo.' }); }

  if (ls.smokingStatus === 'current') { lifestyleMod -= 3; factors.push({ label: 'Tabagismo ativo', impact: 'negative', description: 'Fumar acelera deterioração cardiovascular e de longevidade.' }); }
  if (ls.alcoholWeekly > 14) { lifestyleMod -= 1.5; factors.push({ label: 'Consumo elevado de álcool', impact: 'negative', description: 'Mais de 14 doses/semana afeta fígado e scores metabólicos.' }); }

  if (ls.dailySteps >= 8000) { lifestyleMod += 1; factors.push({ label: 'Passos diários adequados', impact: 'positive', description: `${ls.dailySteps.toLocaleString('pt-BR')} passos/dia contribuem para melhora cardiovascular.` }); }

  // Compliance trajectory
  const overdueExams = data.exams.filter(e => e.status === 'Atrasado').length;
  const upcomingExams = data.exams.filter(e => e.status === 'Próximo').length;
  let complianceDrift = 0;
  if (overdueExams > 0) {
    complianceDrift = -overdueExams * 2.5;
    factors.push({ label: `${overdueExams} exame(s) atrasado(s)`, impact: 'negative', description: 'Exames atrasados reduzem o score de compliance ao longo do tempo.' });
  }
  if (upcomingExams > 2) {
    factors.push({ label: `${upcomingExams} exames próximos`, impact: 'neutral', description: 'Agendar logo mantém a adesão preventiva alta.' });
  }

  // Red biomarkers factor
  const redCount = data.biomarkers.filter(b => b.status === 'red').length;
  if (redCount > 0) {
    factors.push({ label: `${redCount} biomarcador(es) crítico(s)`, impact: 'negative', description: 'Indicadores fora da faixa segura pressionam os scores para baixo.' });
  }

  // Positive biomarkers
  const greenCount = data.biomarkers.filter(b => b.status === 'green' && b.value !== null).length;
  const totalMeasured = data.biomarkers.filter(b => b.value !== null).length;
  if (totalMeasured > 0 && greenCount / totalMeasured >= 0.8) {
    factors.push({ label: 'Maioria dos indicadores normais', impact: 'positive', description: `${greenCount} de ${totalMeasured} biomarcadores na faixa verde sustentam projeção positiva.` });
  }

  // Negative trend patterns
  const negPatterns = patterns.filter(p => p.severity === 'negative');
  if (negPatterns.length > 0) {
    factors.push({ label: `${negPatterns.length} tendência(s) de piora`, impact: 'negative', description: `Biomarcadores piorando: ${negPatterns.slice(0, 3).map(p => p.biomarkerName).join(', ')}.` });
  }
  const posPatterns = patterns.filter(p => p.severity === 'positive');
  if (posPatterns.length > 0) {
    factors.push({ label: `${posPatterns.length} tendência(s) de melhora`, impact: 'positive', description: `Biomarcadores melhorando: ${posPatterns.slice(0, 3).map(p => p.biomarkerName).join(', ')}.` });
  }

  // Combined delta per period
  const baseDelta = biomarkerMomentum + lifestyleMod;

  function project(current: number, extraDrift: number = 0): ScoreForecast {
    const d = baseDelta + extraDrift;
    const m3 = clamp(current + d * 1, 0, 100);
    const m6 = clamp(current + d * 1.8, 0, 100);
    const m12 = clamp(current + d * 2.5, 0, 100);
    const trend: ScoreForecast['trend'] = m12 > current + 2 ? 'improving' : m12 < current - 2 ? 'declining' : 'stable';
    const status: Status = m12 >= 75 ? 'green' : m12 >= 50 ? 'yellow' : 'red';
    return { current, month3: m3, month6: m6, month12: m12, status, trend };
  }

  return {
    cardiac: project(cardiac, redCount > 0 ? -1 : 0),
    metabolic: project(metabolic),
    longevity: project(longevity, lifestyleMod * 0.3),
    compliance: project(compliance, complianceDrift),
    generatedAt: new Date().toISOString(),
    factors: factors.sort((a, b) => {
      const order = { negative: 0, neutral: 1, positive: 2 };
      return order[a.impact] - order[b.impact];
    }),
  };
}
