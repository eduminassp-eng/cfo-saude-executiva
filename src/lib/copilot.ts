import { HealthData, Biomarker, Exam, Status } from '@/types/health';
import { calcCardiacScore, calcMetabolicScore, calcLongevityScore, HIGHER_IS_BETTER, LOWER_IS_BETTER } from './scoring';

// ── Trend Pattern Detection ──

export type TrendDirection = 'rising' | 'falling' | 'stable';
export type TrendSeverity = 'positive' | 'negative' | 'neutral';

export interface TrendPattern {
  biomarkerId: string;
  biomarkerName: string;
  direction: TrendDirection;
  severity: TrendSeverity;
  changePercent: number;
  currentValue: number;
  previousValue: number;
  unit: string;
  insight: string;
  dataPoints: number;
}

const trendInsights: Record<string, { rising: string; falling: string; stable: string }> = {
  'ldl': {
    rising: 'LDL em tendência de alta — risco aterosclerótico crescente. Considere ajustes na dieta (menos gordura saturada) e avaliação de estatinas.',
    falling: 'LDL em queda — ótimo progresso no controle lipídico. Mantenha as mudanças que estão funcionando.',
    stable: 'LDL estável — controle lipídico consistente. Continue monitorando semestralmente.',
  },
  'glicemia': {
    rising: 'Glicemia em tendência de alta — alerta para progressão rumo à pré-diabetes. Priorize redução de carboidratos refinados e atividade física.',
    falling: 'Glicemia melhorando — indicativo de melhor sensibilidade insulínica. Mudanças de estilo de vida estão surtindo efeito.',
    stable: 'Glicemia estável — bom controle glicêmico mantido ao longo do tempo.',
  },
  'hba1c': {
    rising: 'HbA1c subindo — controle glicêmico dos últimos 3 meses piorando. Revisão urgente de dieta e atividade.',
    falling: 'HbA1c em queda — excelente melhora no controle glicêmico de longo prazo.',
    stable: 'HbA1c estável — controle glicêmico consistente.',
  },
  'hdl': {
    rising: 'HDL em alta — fator protetor cardiovascular se fortalecendo. O exercício aeróbico está fazendo diferença.',
    falling: 'HDL em queda — perda de proteção cardiovascular. Intensifique exercícios aeróbicos e avalie a dieta.',
    stable: 'HDL estável — proteção cardiovascular mantida.',
  },
  'trig': {
    rising: 'Triglicerídeos em alta — pode indicar consumo excessivo de carboidratos ou álcool. Risco de síndrome metabólica.',
    falling: 'Triglicerídeos em queda — metabolismo lipídico melhorando. Dieta e exercício estão funcionando.',
    stable: 'Triglicerídeos estáveis — metabolismo lipídico sem alterações significativas.',
  },
  'pa-sys': {
    rising: 'Pressão sistólica em tendência de alta — risco cardiovascular crescente. Reduzir sódio e estresse.',
    falling: 'Pressão sistólica em queda — bom controle pressórico. Mudanças de hábito estão funcionando.',
    stable: 'Pressão sistólica estável — controle pressórico mantido.',
  },
  'pa-dia': {
    rising: 'Pressão diastólica subindo — atenção à saúde cardiovascular.',
    falling: 'Pressão diastólica melhorando — resposta positiva ao tratamento ou mudanças de estilo de vida.',
    stable: 'Pressão diastólica estável.',
  },
  'creatinina': {
    rising: 'Creatinina em alta — possível declínio da função renal. Monitorar de perto.',
    falling: 'Creatinina em queda — função renal melhorando ou estabilizando.',
    stable: 'Creatinina estável — função renal preservada.',
  },
  'tsh': {
    rising: 'TSH em alta — possível hipotireoidismo em progressão. Avaliar com endocrinologista.',
    falling: 'TSH em queda — pode indicar hipertireoidismo. Correlacionar com sintomas.',
    stable: 'TSH estável — função tireoidiana equilibrada.',
  },
  'vitd': {
    rising: 'Vitamina D subindo — suplementação e exposição solar estão funcionando.',
    falling: 'Vitamina D em queda — reavaliar suplementação e exposição solar.',
    stable: 'Vitamina D estável — níveis mantidos adequadamente.',
  },
  'pcr': {
    rising: 'PCR em alta — inflamação sistêmica aumentando. Risco cardiovascular residual.',
    falling: 'PCR em queda — redução da inflamação sistêmica. Ótimo sinal.',
    stable: 'PCR estável — perfil inflamatório sem mudanças.',
  },
  'insulina': {
    rising: 'Insulina em jejum subindo — possível piora da resistência insulínica.',
    falling: 'Insulina em queda — sensibilidade insulínica melhorando.',
    stable: 'Insulina estável — sem progressão de resistência insulínica.',
  },
  'ferritina': {
    rising: 'Ferritina subindo — reservas de ferro se recuperando.',
    falling: 'Ferritina em queda — avaliar dieta e possíveis perdas de ferro.',
    stable: 'Ferritina estável — reservas de ferro mantidas.',
  },
  'testosterona': {
    rising: 'Testosterona em alta — equilíbrio hormonal melhorando.',
    falling: 'Testosterona em queda — avaliar causas e considerar acompanhamento hormonal.',
    stable: 'Testosterona estável — equilíbrio hormonal mantido.',
  },
};

function getDefaultInsight(name: string, direction: TrendDirection, severity: TrendSeverity, pct: number): string {
  const absPct = Math.abs(pct).toFixed(0);
  if (direction === 'stable') return `${name} estável ao longo das medições recentes.`;
  const dirText = direction === 'rising' ? 'aumento' : 'redução';
  const qualText = severity === 'positive' ? 'tendência positiva' :
    severity === 'negative' ? 'requer atenção' : 'sem impacto clínico relevante';
  return `${name} com ${dirText} de ${absPct}% — ${qualText}.`;
}

export function detectTrendPatterns(data: HealthData): TrendPattern[] {
  const patterns: TrendPattern[] = [];

  for (const b of data.biomarkers) {
    if (b.value === null || b.history.length === 0) continue;

    // Use last value from history as comparison
    const prev = b.history[0].value;
    const current = b.value;
    if (prev === 0 && current === 0) continue;

    const base = prev || 1;
    const changePct = ((current - prev) / Math.abs(base)) * 100;

    // Ignore tiny changes (< 3%)
    if (Math.abs(changePct) < 3) {
      // Only include stable patterns for important markers
      const importantMarkers = ['ldl', 'glicemia', 'hba1c', 'hdl', 'pa-sys'];
      if (!importantMarkers.includes(b.id)) continue;

      const insight = trendInsights[b.id]?.stable ?? getDefaultInsight(b.name, 'stable', 'neutral', 0);
      patterns.push({
        biomarkerId: b.id,
        biomarkerName: b.name,
        direction: 'stable',
        severity: 'neutral',
        changePercent: Math.round(changePct * 10) / 10,
        currentValue: current,
        previousValue: prev,
        unit: b.unit,
        insight,
        dataPoints: b.history.length + 1,
      });
      continue;
    }

    const direction: TrendDirection = changePct > 0 ? 'rising' : 'falling';

    // Determine if this direction is good or bad
    let severity: TrendSeverity = 'neutral';
    if (LOWER_IS_BETTER.has(b.id)) {
      severity = direction === 'rising' ? 'negative' : 'positive';
    } else if (HIGHER_IS_BETTER.has(b.id)) {
      severity = direction === 'rising' ? 'positive' : 'negative';
    }

    const insight = trendInsights[b.id]?.[direction] ?? getDefaultInsight(b.name, direction, severity, changePct);

    patterns.push({
      biomarkerId: b.id,
      biomarkerName: b.name,
      direction,
      severity,
      changePercent: Math.round(changePct * 10) / 10,
      currentValue: current,
      previousValue: prev,
      unit: b.unit,
      insight,
      dataPoints: b.history.length + 1,
    });
  }

  // Sort: negative first, then positive, then neutral; within each group sort by abs change
  const severityOrder: Record<TrendSeverity, number> = { negative: 0, positive: 1, neutral: 2 };
  patterns.sort((a, b) => {
    const diff = severityOrder[a.severity] - severityOrder[b.severity];
    if (diff !== 0) return diff;
    return Math.abs(b.changePercent) - Math.abs(a.changePercent);
  });

  return patterns;
}

export interface BiomarkerInsight {
  biomarker: Biomarker;
  interpretation: string;
  scoreImpact: { cardiac: string; metabolic: string; longevity: string };
  nextStep: string;
  doctorQuestion: string;
}

export interface ExamInsight {
  exam: Exam;
  interpretation: string;
  nextStep: string;
  doctorQuestion: string;
}

export interface ExecutiveSummary {
  strengths: string[];
  attentionPoints: string[];
  overdueExams: Exam[];
  suggestedAppointments: string[];
}

const biomarkerInterpretations: Record<string, Record<string, string>> = {
  'pa-sys': {
    green: 'Pressão sistólica dentro da faixa ideal, indicando bom controle hemodinâmico.',
    yellow: 'Pressão sistólica levemente elevada — pré-hipertensão. Requer monitoramento regular.',
    red: 'Pressão sistólica elevada — hipertensão estabelecida. Intervenção necessária.',
  },
  'pa-dia': {
    green: 'Pressão diastólica normal, sem sinais de sobrecarga vascular.',
    yellow: 'Pressão diastólica no limite superior — acompanhar de perto.',
    red: 'Pressão diastólica elevada — risco cardiovascular aumentado.',
  },
  'glicemia': {
    green: 'Glicemia em jejum dentro da normalidade, sem sinais de resistência insulínica.',
    yellow: 'Glicemia limítrofe — pré-diabetes possível. Avaliar estilo de vida.',
    red: 'Glicemia elevada — investigar diabetes. Ação imediata recomendada.',
  },
  'hba1c': {
    green: 'Hemoglobina glicada normal — bom controle glicêmico nos últimos 3 meses.',
    yellow: 'HbA1c na faixa de pré-diabetes. Importante ajustar dieta e exercícios.',
    red: 'HbA1c elevada — diabetes provável ou descompensada.',
  },
  'ldl': {
    green: 'LDL dentro da meta — risco aterosclerótico controlado.',
    yellow: 'LDL levemente acima da meta. Considerar ajustes dietéticos e atividade física.',
    red: 'LDL significativamente elevado — alto risco cardiovascular. Avaliar estatinas.',
  },
  'hdl': {
    green: 'HDL adequado — fator protetor cardiovascular presente.',
    yellow: 'HDL abaixo do ideal — considerar exercícios aeróbicos para elevá-lo.',
    red: 'HDL muito baixo — perda de fator protetor. Risco cardiovascular aumentado.',
  },
  'trig': {
    green: 'Triglicerídeos normais — metabolismo lipídico saudável.',
    yellow: 'Triglicerídeos levemente elevados — ajustar consumo de carboidratos e álcool.',
    red: 'Triglicerídeos altos — risco de pancreatite e síndrome metabólica.',
  },
  'creatinina': {
    green: 'Creatinina normal — função renal preservada.',
    yellow: 'Creatinina no limite — monitorar função renal periodicamente.',
    red: 'Creatinina elevada — possível comprometimento renal.',
  },
  'ureia': {
    green: 'Ureia normal — boa filtração renal.',
    yellow: 'Ureia no limite superior — hidratar-se adequadamente.',
    red: 'Ureia elevada — função renal comprometida.',
  },
  'tsh': {
    green: 'TSH normal — função tireoidiana equilibrada.',
    yellow: 'TSH alterado — possível disfunção tireoidiana subclínica.',
    red: 'TSH fora da faixa — investigar hipo ou hipertireoidismo.',
  },
  't4livre': {
    green: 'T4 livre normal — tireoide funcionando adequadamente.',
    yellow: 'T4 livre no limite — correlacionar com TSH.',
    red: 'T4 livre alterado — disfunção tireoidiana provável.',
  },
  'tgo': {
    green: 'TGO normal — sem sinais de lesão hepática.',
    yellow: 'TGO levemente elevado — monitorar enzimas hepáticas.',
    red: 'TGO elevado — possível dano hepatocelular.',
  },
  'tgp': {
    green: 'TGP normal — fígado saudável.',
    yellow: 'TGP no limite — atenção à saúde hepática.',
    red: 'TGP elevado — avaliar causas de lesão hepática.',
  },
  'ggt': {
    green: 'GGT normal — sem sinais de colestase ou abuso alcoólico.',
    yellow: 'GGT levemente elevado — avaliar consumo de álcool e medicamentos.',
    red: 'GGT alto — possível colestase ou lesão hepática.',
  },
  'vitd': {
    green: 'Vitamina D em nível adequado — boa saúde óssea e imunológica.',
    yellow: 'Vitamina D insuficiente — considerar suplementação e exposição solar.',
    red: 'Vitamina D deficiente — suplementação necessária.',
  },
  'vitb12': {
    green: 'Vitamina B12 normal — sem risco de anemia megaloblástica.',
    yellow: 'B12 no limite inferior — monitorar e considerar suplementação.',
    red: 'B12 baixa — suplementar e investigar absorção.',
  },
  'ferritina': {
    green: 'Ferritina normal — reservas de ferro adequadas.',
    yellow: 'Ferritina alterada — avaliar dieta e possíveis perdas.',
    red: 'Ferritina fora da faixa — investigar causa.',
  },
  'imc': {
    green: 'IMC na faixa saudável — peso adequado para a estatura.',
    yellow: 'IMC indicando sobrepeso — oportunidade para ajustes em dieta e exercício.',
    red: 'IMC indicando obesidade — risco metabólico e cardiovascular elevado.',
  },
  'cintura': {
    green: 'Circunferência abdominal adequada — baixo risco de gordura visceral.',
    yellow: 'Circunferência no limite — atenção à gordura abdominal.',
    red: 'Circunferência elevada — alto risco de síndrome metabólica.',
  },
  'testosterona': {
    green: 'Testosterona em nível saudável — equilíbrio hormonal mantido.',
    yellow: 'Testosterona no limite inferior — avaliar sintomas e estilo de vida.',
    red: 'Testosterona baixa — investigar hipogonadismo.',
  },
  'pcr': {
    green: 'PCR ultrassensível normal — sem inflamação sistêmica detectada.',
    yellow: 'PCR levemente elevado — inflamação subclínica presente. Avaliar causas.',
    red: 'PCR elevado — inflamação significativa. Risco cardiovascular aumentado.',
  },
  'apob': {
    green: 'Apo B normal — quantidade de partículas aterogênicas controlada.',
    yellow: 'Apo B elevado — número aumentado de partículas LDL. Monitorar lipídeos.',
    red: 'Apo B muito elevado — alto risco aterosclerótico.',
  },
  'insulina': {
    green: 'Insulina em jejum normal — sem sinais de resistência insulínica.',
    yellow: 'Insulina elevada — possível resistência insulínica inicial.',
    red: 'Insulina muito elevada — resistência insulínica estabelecida.',
  },
  'psa': {
    green: 'PSA normal — sem indicativos de patologia prostática.',
    yellow: 'PSA levemente elevado — acompanhar anualmente.',
    red: 'PSA elevado — investigar com urologista.',
  },
};

const biomarkerNextSteps: Record<string, Record<string, string>> = {
  'pa-sys': {
    green: 'Manter hábitos saudáveis e aferir semestralmente.',
    yellow: 'Reduzir sódio, praticar exercício regular, aferir mensalmente.',
    red: 'Consultar cardiologista com urgência. Considerar tratamento farmacológico.',
  },
  'ldl': {
    green: 'Manter dieta equilibrada e repetir perfil lipídico em 12 meses.',
    yellow: 'Aumentar fibras, reduzir gordura saturada, reavaliar em 6 meses.',
    red: 'Discutir início de estatina com médico. Reavaliar em 3 meses.',
  },
  'vitd': {
    green: 'Manter exposição solar e suplementação se necessário.',
    yellow: 'Iniciar suplementação de 1.000-2.000 UI/dia. Reavaliar em 3 meses.',
    red: 'Suplementar dose de ataque. Reavaliar em 8 semanas.',
  },
  'imc': {
    green: 'Manter peso e composição corporal atual.',
    yellow: 'Focar em perda de 3-5% do peso com dieta e exercício.',
    red: 'Buscar acompanhamento nutricional e de atividade física intensivo.',
  },
};

const biomarkerDoctorQuestions: Record<string, string> = {
  'pa-sys': 'Qual a meta de pressão arterial ideal para o meu perfil de risco?',
  'pa-dia': 'A pressão diastólica está adequada para minha faixa etária?',
  'glicemia': 'Devo realizar teste de tolerância à glicose para investigar pré-diabetes?',
  'hba1c': 'A HbA1c justifica mudanças no manejo do controle glicêmico?',
  'ldl': 'Considerando meu risco cardiovascular, devo iniciar estatina?',
  'hdl': 'Que estratégias podem elevar meu HDL de forma eficaz?',
  'trig': 'Os triglicerídeos elevados indicam necessidade de mudança dietética específica?',
  'creatinina': 'A taxa de filtração glomerular está adequada para minha idade?',
  'ureia': 'A relação ureia/creatinina sugere alguma alteração?',
  'tsh': 'Preciso repetir os exames de tireoide em prazo mais curto?',
  't4livre': 'O T4 livre indica necessidade de ajuste terapêutico?',
  'tgo': 'As transaminases justificam investigação com ultrassom hepático?',
  'tgp': 'Devo investigar causas específicas de elevação do TGP?',
  'ggt': 'O GGT elevado pode estar relacionado a medicamentos que uso?',
  'vitd': 'Qual dose de vitamina D é adequada para meu nível atual?',
  'vitb12': 'Devo suplementar B12 por via oral ou intramuscular?',
  'ferritina': 'A ferritina atual reflete adequadamente minhas reservas de ferro?',
  'imc': 'Qual a composição corporal ideal para minha faixa etária?',
  'cintura': 'A circunferência abdominal indica risco metabólico significativo?',
  'testosterona': 'Meu nível de testosterona justifica alguma intervenção?',
  'pcr': 'A PCR elevada pode estar relacionada a risco cardiovascular residual?',
  'apob': 'A apolipoproteína B deve ser usada como meta terapêutica no meu caso?',
  'insulina': 'O HOMA-IR calculado confirma resistência insulínica?',
  'psa': 'Devo realizar exames adicionais de rastreamento prostático?',
};

// Which scores each biomarker impacts
const biomarkerScoreMap: Record<string, { cardiac: boolean; metabolic: boolean; longevity: boolean }> = {
  'pa-sys': { cardiac: true, metabolic: false, longevity: true },
  'pa-dia': { cardiac: true, metabolic: false, longevity: true },
  'glicemia': { cardiac: false, metabolic: true, longevity: true },
  'hba1c': { cardiac: true, metabolic: true, longevity: true },
  'ldl': { cardiac: true, metabolic: false, longevity: true },
  'hdl': { cardiac: true, metabolic: false, longevity: true },
  'trig': { cardiac: true, metabolic: true, longevity: true },
  'creatinina': { cardiac: false, metabolic: false, longevity: true },
  'ureia': { cardiac: false, metabolic: false, longevity: true },
  'tsh': { cardiac: false, metabolic: false, longevity: true },
  't4livre': { cardiac: false, metabolic: false, longevity: true },
  'tgo': { cardiac: false, metabolic: true, longevity: true },
  'tgp': { cardiac: false, metabolic: true, longevity: true },
  'ggt': { cardiac: false, metabolic: true, longevity: true },
  'vitd': { cardiac: false, metabolic: false, longevity: true },
  'vitb12': { cardiac: false, metabolic: false, longevity: false },
  'ferritina': { cardiac: false, metabolic: false, longevity: false },
  'imc': { cardiac: true, metabolic: true, longevity: true },
  'cintura': { cardiac: true, metabolic: true, longevity: true },
  'testosterona': { cardiac: false, metabolic: false, longevity: true },
  'pcr': { cardiac: true, metabolic: false, longevity: true },
  'apob': { cardiac: true, metabolic: false, longevity: true },
  'insulina': { cardiac: false, metabolic: true, longevity: true },
  'psa': { cardiac: false, metabolic: false, longevity: false },
};

function impactLabel(status: string, affects: boolean): string {
  if (!affects) return '—';
  if (status === 'green') return 'Contribui positivamente';
  if (status === 'yellow') return 'Impacto moderado';
  if (status === 'red') return 'Reduz significativamente';
  return 'Sem dados suficientes';
}

export function generateBiomarkerInsights(data: HealthData): BiomarkerInsight[] {
  return data.biomarkers.map(b => {
    const statusKey = b.status === 'unknown' ? 'green' : b.status;
    const interp = biomarkerInterpretations[b.id]?.[statusKey] ?? 'Biomarcador dentro dos parâmetros esperados.';
    const defaultNext = statusKey === 'green'
      ? 'Manter acompanhamento regular conforme frequência sugerida.'
      : 'Reavaliar em consulta médica e ajustar condutas se necessário.';
    const nextStep = biomarkerNextSteps[b.id]?.[statusKey] ?? defaultNext;
    const question = biomarkerDoctorQuestions[b.id] ?? 'Este resultado requer alguma ação adicional no meu caso?';
    const map = biomarkerScoreMap[b.id] ?? { cardiac: false, metabolic: false, longevity: false };

    return {
      biomarker: b,
      interpretation: interp,
      scoreImpact: {
        cardiac: impactLabel(statusKey, map.cardiac),
        metabolic: impactLabel(statusKey, map.metabolic),
        longevity: impactLabel(statusKey, map.longevity),
      },
      nextStep,
      doctorQuestion: question,
    };
  });
}

export function generateExamInsights(data: HealthData): ExamInsight[] {
  return data.exams.map(e => {
    let interpretation = '';
    let nextStep = '';
    let doctorQuestion = '';

    if (e.status === 'Em dia') {
      interpretation = `${e.name} realizado e dentro do prazo recomendado. Excelente adesão preventiva.`;
      nextStep = `Próxima realização prevista para ${e.nextDate ? new Date(e.nextDate).toLocaleDateString('pt-BR') : 'data a definir'}.`;
      doctorQuestion = `O resultado do último ${e.name} requer algum ajuste no acompanhamento?`;
    } else if (e.status === 'Próximo') {
      interpretation = `${e.name} está próximo do vencimento. Importante agendar em breve.`;
      nextStep = `Agendar ${e.name} nos próximos 30 dias para manter a regularidade preventiva.`;
      doctorQuestion = `Há alguma preparação especial necessária para o próximo ${e.name}?`;
    } else if (e.status === 'Atrasado') {
      interpretation = `${e.name} está atrasado. Este exame é importante para rastreamento de ${e.mainRisk.toLowerCase()}.`;
      nextStep = `Agendar ${e.name} com urgência. Prioridade: ${e.importance}.`;
      doctorQuestion = `O atraso no ${e.name} pode ter impactado alguma detecção importante?`;
    } else {
      interpretation = `${e.name} ainda não foi realizado. Recomendado para rastreamento de ${e.mainRisk.toLowerCase()}.`;
      nextStep = `Discutir com seu médico a necessidade e o melhor momento para realizar o ${e.name}.`;
      doctorQuestion = `O ${e.name} é indicado para o meu perfil de risco e faixa etária?`;
    }

    return { exam: e, interpretation, nextStep, doctorQuestion };
  });
}

export function generateExecutiveSummary(data: HealthData): ExecutiveSummary {
  const greenBiomarkers = data.biomarkers.filter(b => b.status === 'green');
  const nonGreenBiomarkers = data.biomarkers.filter(b => b.status !== 'green' && b.status !== 'unknown');
  const overdueExams = data.exams.filter(e => e.status === 'Atrasado');

  // Strengths: top green biomarkers by importance
  const strengthPriority = ['glicemia', 'hba1c', 'creatinina', 'tsh', 'psa', 'tgo', 'tgp', 'hdl', 'testosterona', 'ferritina'];
  const strengths = strengthPriority
    .filter(id => greenBiomarkers.some(b => b.id === id))
    .slice(0, 3)
    .map(id => {
      const b = greenBiomarkers.find(b => b.id === id)!;
      return `${b.name}: ${b.value} ${b.unit} — dentro da faixa ideal`;
    });

  // Attention points: non-green biomarkers sorted by severity
  const severityOrder = { red: 0, yellow: 1 };
  const sortedAttention = [...nonGreenBiomarkers].sort(
    (a, b) => (severityOrder[a.status as 'red' | 'yellow'] ?? 2) - (severityOrder[b.status as 'red' | 'yellow'] ?? 2)
  );
  const attentionPoints = sortedAttention.slice(0, 3).map(b => {
    const interp = biomarkerInterpretations[b.id]?.[b.status] ?? 'Requer acompanhamento.';
    return `${b.name}: ${b.value} ${b.unit} — ${interp}`;
  });

  // Suggested appointments
  const suggestedAppointments: string[] = [];
  if (overdueExams.length > 0) {
    const highPriority = overdueExams.filter(e => e.importance === 'Alta');
    if (highPriority.length > 0) {
      suggestedAppointments.push(`Agendar com prioridade: ${highPriority.map(e => e.name).join(', ')}`);
    }
    const otherOverdue = overdueExams.filter(e => e.importance !== 'Alta');
    if (otherOverdue.length > 0) {
      suggestedAppointments.push(`Agendar quando possível: ${otherOverdue.map(e => e.name).join(', ')}`);
    }
  }

  const cardiac = calcCardiacScore(data);
  const metabolic = calcMetabolicScore(data);
  if (cardiac.value < 75) {
    suggestedAppointments.push('Consulta com cardiologista para revisão do perfil cardiovascular');
  }
  if (metabolic.value < 75) {
    suggestedAppointments.push('Consulta com endocrinologista para avaliação metabólica');
  }

  const pendingExams = data.exams.filter(e => e.status === 'Pendente');
  if (pendingExams.length > 0) {
    suggestedAppointments.push(`Discutir necessidade de: ${pendingExams.map(e => e.name).join(', ')}`);
  }

  return {
    strengths,
    attentionPoints,
    overdueExams,
    suggestedAppointments: suggestedAppointments.slice(0, 4),
  };
}
