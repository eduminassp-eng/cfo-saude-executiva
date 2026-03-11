import { HealthData, Status } from '@/types/health';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore } from './scoring';
import { generateForecast } from './forecast';
import { detectTrendPatterns } from './copilot';

export interface HealthPriority {
  id: string;
  title: string;
  whyItMatters: string;
  expectedImpact: string;
  nextAction: string;
  timeHorizon: string;
  domain: string;
  urgency: number; // 0-100, higher = more urgent
  type: 'exam' | 'biomarker' | 'lifestyle' | 'specialist';
}

function statusUrgency(s: Status): number {
  return s === 'red' ? 100 : s === 'yellow' ? 60 : s === 'unknown' ? 30 : 0;
}

export function generatePriorities(data: HealthData): HealthPriority[] {
  const priorities: HealthPriority[] = [];
  const cardiac = calcCardiacScore(data);
  const metabolic = calcMetabolicScore(data);
  const forecast = generateForecast(data);
  const trends = detectTrendPatterns(data);

  // 1. Overdue exams — high urgency
  const overdueExams = data.exams.filter(e => e.status === 'Atrasado');
  for (const e of overdueExams) {
    const isScreening = ['Consulta Dermatológica', 'Consulta Oftalmológica', 'Score de Cálcio Coronariano'].includes(e.name);
    priorities.push({
      id: `exam-${e.id}`,
      title: `Agendar ${e.name}`,
      whyItMatters: e.mainRisk
        ? `Esse exame é essencial para rastreamento de ${e.mainRisk.toLowerCase()}. O atraso reduz a capacidade de detecção precoce.`
        : `Exame preventivo atrasado — manter a regularidade é fundamental para detecção precoce.`,
      expectedImpact: `Regularizar esse exame pode elevar seu score de compliance em até ${Math.round(100 / data.exams.length)} pontos e melhorar a projeção de longevidade.`,
      nextAction: e.doctor ? `Contatar ${e.doctor} para agendamento.` : 'Agendar consulta com especialista da área.',
      timeHorizon: 'Próximas 2 semanas',
      domain: e.category,
      urgency: isScreening ? 85 : 90,
      type: 'exam',
    });
  }

  // 2. Red biomarkers — critical
  const redBiomarkers = data.biomarkers.filter(b => b.status === 'red' && b.value !== null);
  for (const b of redBiomarkers) {
    priorities.push({
      id: `bio-red-${b.id}`,
      title: `Normalizar ${b.name}`,
      whyItMatters: `Valor atual de ${b.value} ${b.unit} está fora da faixa segura${b.targetMax ? ` (ref: ${b.targetMin ?? '–'}–${b.targetMax} ${b.unit})` : ''}. Indicadores críticos impactam diretamente os scores cardíaco e metabólico.`,
      expectedImpact: 'Corrigir esse marcador pode elevar seus scores entre 5 e 15 pontos, dependendo do peso no cálculo.',
      nextAction: `Discutir resultado com médico assistente e avaliar intervenção (medicamentosa ou comportamental).`,
      timeHorizon: 'Próximos 30 dias',
      domain: b.category,
      urgency: 95,
      type: 'biomarker',
    });
  }

  // 3. Worsening trends
  const upIsGood = new Set(['hdl', 'vitd', 'vitb12', 'ferritina', 'testosterona']);
  const worseningTrends = trends.filter(t => t.severity === 'negative' && Math.abs(t.changePercent) >= 5);
  for (const t of worseningTrends) {
    const b = data.biomarkers.find(bio => bio.id === t.biomarkerId);
    if (!b || b.status === 'red') continue; // already covered above
    priorities.push({
      id: `trend-${t.biomarkerId}`,
      title: `Reverter tendência de ${t.biomarkerName}`,
      whyItMatters: `${t.biomarkerName} apresenta piora de ${Math.abs(t.changePercent).toFixed(1)}% em relação ao registro anterior. Se a tendência continuar, pode entrar na faixa de risco.`,
      expectedImpact: 'Estabilizar esse marcador evita declínio projetado de 3-8 pontos nos scores ao longo de 6 meses.',
      nextAction: t.insight || 'Monitorar nas próximas consultas e avaliar ajustes.',
      timeHorizon: 'Próximos 3 meses',
      domain: b?.category ?? 'Geral',
      urgency: 65 + Math.min(Math.abs(t.changePercent), 20),
      type: 'biomarker',
    });
  }

  // 4. Yellow biomarkers with forecast impact
  const yellowBiomarkers = data.biomarkers.filter(b => b.status === 'yellow' && b.value !== null);
  for (const b of yellowBiomarkers) {
    // Skip if already in worsening trends
    if (priorities.some(p => p.id === `trend-${b.id}`)) continue;
    priorities.push({
      id: `bio-yellow-${b.id}`,
      title: `Melhorar ${b.name}`,
      whyItMatters: `Valor de ${b.value} ${b.unit} está próximo do limite. Prevenir a progressão é mais eficaz do que tratar depois.`,
      expectedImpact: 'Trazer para a faixa verde pode contribuir com 3-8 pontos nos scores relacionados.',
      nextAction: `Revisar hábitos e discutir com médico na próxima consulta.`,
      timeHorizon: 'Próximos 3–6 meses',
      domain: b.category,
      urgency: 55,
      type: 'biomarker',
    });
  }

  // 5. Lifestyle improvements
  const ls = data.lifestyle;
  if (ls.smokingStatus === 'current') {
    priorities.push({
      id: 'lifestyle-smoking',
      title: 'Cessar tabagismo',
      whyItMatters: 'Tabagismo ativo é o principal fator de risco evitável. Impacta diretamente scores cardíaco, metabólico e de longevidade, com projeção de declínio acelerado.',
      expectedImpact: 'Parar de fumar pode elevar o score de longevidade em até 15 pontos em 12 meses.',
      nextAction: 'Consultar médico sobre programa de cessação e suporte farmacológico.',
      timeHorizon: 'Início imediato',
      domain: 'Estilo de Vida',
      urgency: 92,
      type: 'lifestyle',
    });
  }

  if (ls.exerciseFrequency <= 1) {
    priorities.push({
      id: 'lifestyle-exercise',
      title: 'Aumentar frequência de exercício',
      whyItMatters: 'Atividade física insuficiente compromete o metabolismo, a saúde cardiovascular e a qualidade do sono. É um dos pilares mais impactantes da longevidade.',
      expectedImpact: 'Chegar a 3x/semana pode elevar os scores metabólico e de longevidade em 5-10 pontos.',
      nextAction: 'Iniciar com caminhadas de 30 min, 3x/semana, e progredir gradualmente.',
      timeHorizon: 'Próximas 4 semanas',
      domain: 'Estilo de Vida',
      urgency: 75,
      type: 'lifestyle',
    });
  } else if (ls.exerciseFrequency >= 2 && ls.exerciseFrequency <= 2) {
    priorities.push({
      id: 'lifestyle-exercise-up',
      title: 'Aumentar exercício para 4x/semana',
      whyItMatters: 'Você já pratica atividade física, mas aumentar a frequência pode otimizar seus resultados metabólicos e cardiovasculares.',
      expectedImpact: 'Incremento de 2-5 pontos nos scores com melhora consistente.',
      nextAction: 'Adicionar uma sessão semanal de atividade aeróbica ou resistência.',
      timeHorizon: 'Próximos 2 meses',
      domain: 'Estilo de Vida',
      urgency: 45,
      type: 'lifestyle',
    });
  }

  if (ls.sleepHours < 6) {
    priorities.push({
      id: 'lifestyle-sleep',
      title: 'Melhorar qualidade e duração do sono',
      whyItMatters: 'Sono abaixo de 6 horas compromete recuperação muscular, regulação hormonal e metabolismo glicídico.',
      expectedImpact: 'Regularizar o sono para 7-8h pode melhorar os scores em 3-6 pontos.',
      nextAction: 'Estabelecer rotina de sono com horários fixos e reduzir telas antes de dormir.',
      timeHorizon: 'Próximas 2-4 semanas',
      domain: 'Estilo de Vida',
      urgency: 70,
      type: 'lifestyle',
    });
  }

  if (ls.alcoholWeekly > 14) {
    priorities.push({
      id: 'lifestyle-alcohol',
      title: 'Reduzir consumo de álcool',
      whyItMatters: 'Mais de 14 doses por semana eleva risco hepático e metabólico, impactando TGO, TGP, GGT e triglicerídeos.',
      expectedImpact: 'Reduzir para menos de 7 doses/semana pode melhorar os marcadores hepáticos em 2-3 meses.',
      nextAction: 'Estabelecer limite semanal e monitorar enzimas hepáticas.',
      timeHorizon: 'Próximas 4-8 semanas',
      domain: 'Estilo de Vida',
      urgency: 65,
      type: 'lifestyle',
    });
  }

  // 6. Specialist appointments based on domain scores
  if (cardiac.value < 60) {
    const exists = priorities.some(p => p.domain === 'Cardiovascular' && p.type === 'specialist');
    if (!exists) {
      priorities.push({
        id: 'specialist-cardio',
        title: 'Consultar cardiologista',
        whyItMatters: `Score cardíaco de ${cardiac.value}/100 indica necessidade de avaliação especializada. O perfil pressórico e lipídico requer acompanhamento ativo.`,
        expectedImpact: 'Um plano de tratamento pode estabilizar ou reverter a tendência em 3-6 meses.',
        nextAction: 'Agendar consulta com cardiologista levando resultados recentes.',
        timeHorizon: 'Próximas 2 semanas',
        domain: 'Cardiovascular',
        urgency: 80,
        type: 'specialist',
      });
    }
  }

  if (metabolic.value < 60) {
    priorities.push({
      id: 'specialist-endocrinologist',
      title: 'Consultar endocrinologista',
      whyItMatters: `Score metabólico de ${metabolic.value}/100 sugere avaliação endocrinológica. Resistência insulínica e composição corporal merecem atenção especializada.`,
      expectedImpact: 'Intervenção precoce pode prevenir progressão para diabetes ou síndrome metabólica.',
      nextAction: 'Agendar consulta trazendo hemoglobina glicada, insulina e perfil lipídico.',
      timeHorizon: 'Próximas 4 semanas',
      domain: 'Metabólico',
      urgency: 78,
      type: 'specialist',
    });
  }

  // Sort by urgency (highest first) and deduplicate
  priorities.sort((a, b) => b.urgency - a.urgency);

  return priorities;
}
