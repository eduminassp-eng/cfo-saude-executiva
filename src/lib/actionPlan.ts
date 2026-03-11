import { HealthData } from '@/types/health';

export interface ActionItem {
  action: string;
  reason: string;
  priority: 'alta' | 'média' | 'baixa';
}

export interface ActionPlan {
  thirtyDays: ActionItem[];
  ninetyDays: ActionItem[];
  oneEightyDays: ActionItem[];
}

export function generateActionPlan(data: HealthData): ActionPlan {
  const thirtyDays: ActionItem[] = [];
  const ninetyDays: ActionItem[] = [];
  const oneEightyDays: ActionItem[] = [];

  const overdueHigh = data.exams.filter(e => e.status === 'Atrasado' && e.importance === 'Alta');
  overdueHigh.forEach(e => {
    thirtyDays.push({
      action: `Agendar ${e.name} com urgência`,
      reason: `Atrasado — rastreamento de ${e.mainRisk.toLowerCase()}`,
      priority: 'alta',
    });
  });

  const redBiomarkers = data.biomarkers.filter(b => b.status === 'red');
  redBiomarkers.forEach(b => {
    thirtyDays.push({
      action: `Consultar especialista sobre ${b.name} (${b.value} ${b.unit})`,
      reason: 'Valor em faixa crítica — requer avaliação imediata',
      priority: 'alta',
    });
  });

  const upcoming = data.exams.filter(e => e.status === 'Próximo');
  upcoming.forEach(e => {
    thirtyDays.push({
      action: `Agendar ${e.name} antes do vencimento`,
      reason: `Vence em breve — manter adesão preventiva`,
      priority: 'média',
    });
  });

  const overdueOther = data.exams.filter(e => e.status === 'Atrasado' && e.importance !== 'Alta');
  overdueOther.forEach(e => {
    ninetyDays.push({
      action: `Realizar ${e.name}`,
      reason: `Atrasado — importância ${e.importance.toLowerCase()}`,
      priority: 'média',
    });
  });

  const yellowBiomarkers = data.biomarkers.filter(b => b.status === 'yellow');
  if (yellowBiomarkers.length > 0) {
    const metabolic = yellowBiomarkers.filter(b => ['glicemia', 'hba1c', 'insulina', 'imc', 'cintura', 'trig'].includes(b.id));
    if (metabolic.length > 0) {
      ninetyDays.push({
        action: 'Iniciar programa de reeducação alimentar e atividade física regular',
        reason: `${metabolic.length} marcador(es) metabólico(s) em faixa de atenção`,
        priority: 'média',
      });
    }

    const cardiac = yellowBiomarkers.filter(b => ['pa-sys', 'pa-dia', 'ldl', 'pcr'].includes(b.id));
    if (cardiac.length > 0) {
      ninetyDays.push({
        action: 'Agendar consulta cardiológica para reavaliação',
        reason: `${cardiac.length} marcador(es) cardiovascular(es) alterado(s)`,
        priority: 'média',
      });
    }
  }

  if (redBiomarkers.length > 0) {
    ninetyDays.push({
      action: `Repetir exames de ${redBiomarkers.map(b => b.name).slice(0, 3).join(', ')} para avaliar evolução`,
      reason: 'Confirmar melhora após intervenção',
      priority: 'alta',
    });
  }

  if (data.lifestyle.exerciseFrequency < 3) {
    ninetyDays.push({
      action: 'Atingir mínimo de 150 min/semana de atividade física moderada',
      reason: `Frequência atual: ${data.lifestyle.exerciseFrequency}x/semana`,
      priority: 'média',
    });
  }

  if (data.lifestyle.sleepHours < 7) {
    ninetyDays.push({
      action: 'Otimizar higiene do sono para atingir 7-8h por noite',
      reason: `Sono atual: ${data.lifestyle.sleepHours}h`,
      priority: 'baixa',
    });
  }

  const pending = data.exams.filter(e => e.status === 'Pendente');
  pending.slice(0, 4).forEach(e => {
    oneEightyDays.push({
      action: `Discutir necessidade de ${e.name} com médico`,
      reason: `Exame nunca realizado — importância: ${e.importance.toLowerCase()}`,
      priority: e.importance === 'Alta' ? 'média' : 'baixa',
    });
  });

  oneEightyDays.push({
    action: 'Realizar check-up completo com todos os biomarcadores',
    reason: 'Manter acompanhamento semestral de saúde',
    priority: 'média',
  });

  const nutritionIssues = data.biomarkers.filter(b => ['vitd', 'vitb12', 'ferritina'].includes(b.id) && b.status !== 'green');
  if (nutritionIssues.length > 0) {
    oneEightyDays.push({
      action: `Reavaliar níveis de ${nutritionIssues.map(b => b.name).join(', ')} após suplementação`,
      reason: 'Verificar eficácia da suplementação',
      priority: 'média',
    });
  }

  return { thirtyDays: thirtyDays.slice(0, 5), ninetyDays: ninetyDays.slice(0, 5), oneEightyDays: oneEightyDays.slice(0, 5) };
}
