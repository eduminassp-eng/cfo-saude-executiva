import { HealthData } from '@/types/health';
import { MessageCircleQuestion } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  data: HealthData;
}

export function CopilotDoctorQuestions({ data }: Props) {
  const questions = useMemo(() => generateDoctorQuestions(data), [data]);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircleQuestion className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Perguntas para Levar ao Médico</h3>
      </div>
      <div className="space-y-2.5">
        {questions.map((q, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 animate-fade-in"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
          >
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="text-sm leading-relaxed">{q.question}</p>
              <p className="text-xs text-muted-foreground mt-1">{q.reason}</p>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma pergunta gerada — todos os indicadores estão dentro da faixa ideal.</p>
        )}
      </div>
    </div>
  );
}

interface DoctorQuestion {
  question: string;
  reason: string;
}

function generateDoctorQuestions(data: HealthData): DoctorQuestion[] {
  const questions: DoctorQuestion[] = [];

  // Abnormal biomarkers
  const abnormal = data.biomarkers.filter(b => b.status === 'red' || b.status === 'yellow');
  const red = abnormal.filter(b => b.status === 'red');
  const yellow = abnormal.filter(b => b.status === 'yellow');

  if (red.length > 0) {
    const names = red.map(b => b.name).join(', ');
    questions.push({
      question: `Meus valores de ${names} estão fora da faixa. Quais exames complementares devo fazer?`,
      reason: `${red.length} biomarcador(es) em nível crítico`,
    });
  }

  // Specific abnormal biomarker questions
  const questionMap: Record<string, string> = {
    'pa-sys': 'Preciso iniciar tratamento para pressão arterial ou mudanças no estilo de vida são suficientes?',
    'ldl': 'Considerando meu perfil, devo iniciar estatina ou posso tentar controle com dieta primeiro?',
    'hba1c': 'Minha HbA1c indica pré-diabetes? Quais mudanças específicas devo fazer?',
    'glicemia': 'Devo fazer teste de tolerância à glicose para investigar resistência insulínica?',
    'tsh': 'Minha tireoide precisa de tratamento ou apenas acompanhamento?',
    'vitd': 'Qual dose de vitamina D é adequada e por quanto tempo devo suplementar?',
    'pcr': 'A inflamação detectada pode estar relacionada a risco cardiovascular? Devo investigar mais?',
    'insulina': 'Minha insulina indica resistência insulínica? Qual o HOMA-IR calculado?',
    'ferritina': 'Minha ferritina indica deficiência de ferro ou outro problema?',
    'testosterona': 'Meu nível de testosterona justifica reposição hormonal?',
  };

  abnormal.forEach(b => {
    if (questionMap[b.id]) {
      questions.push({
        question: questionMap[b.id],
        reason: `${b.name}: ${b.value} ${b.unit} (${b.status === 'red' ? 'crítico' : 'atenção'})`,
      });
    }
  });

  // Multiple yellow biomarkers pattern
  if (yellow.length >= 3) {
    questions.push({
      question: 'Tenho vários indicadores no limite. Existe um padrão ou síndrome que conecte essas alterações?',
      reason: `${yellow.length} biomarcadores em faixa de atenção simultânea`,
    });
  }

  // Missing data
  const missingBiomarkers = data.biomarkers.filter(b => b.value === null);
  if (missingBiomarkers.length > 0) {
    const names = missingBiomarkers.slice(0, 3).map(b => b.name).join(', ');
    questions.push({
      question: `Devo solicitar exames para ${names}? São importantes para o meu perfil?`,
      reason: `${missingBiomarkers.length} biomarcador(es) sem dados registrados`,
    });
  }

  // Overdue exams
  const overdue = data.exams.filter(e => e.status === 'Atrasado');
  if (overdue.length > 0) {
    const highPriority = overdue.filter(e => e.importance === 'Alta');
    if (highPriority.length > 0) {
      questions.push({
        question: `Estou com ${highPriority.map(e => e.name).join(', ')} atrasado(s). Há risco significativo no atraso?`,
        reason: `${highPriority.length} exame(s) de alta prioridade em atraso`,
      });
    }
  }

  // Pending exams
  const pending = data.exams.filter(e => e.status === 'Pendente');
  if (pending.length > 0) {
    questions.push({
      question: `Quais exames preventivos são mais importantes para minha faixa etária e perfil de risco?`,
      reason: `${pending.length} exame(s) nunca realizados`,
    });
  }

  // Lifestyle-based
  if (data.lifestyle.exerciseFrequency < 3) {
    questions.push({
      question: 'Qual tipo e frequência de exercício é mais indicado para o meu perfil de saúde?',
      reason: `Frequência atual: ${data.lifestyle.exerciseFrequency}x/semana`,
    });
  }

  if (data.lifestyle.sleepHours < 6) {
    questions.push({
      question: 'Meu sono está inadequado. Devo investigar distúrbios do sono?',
      reason: `Apenas ${data.lifestyle.sleepHours}h por noite`,
    });
  }

  return questions.slice(0, 8);
}
