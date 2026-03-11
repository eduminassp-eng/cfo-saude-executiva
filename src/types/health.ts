export type Status = 'green' | 'yellow' | 'red' | 'unknown';

export interface Biomarker {
  id: string;
  name: string;
  value: number | null;
  unit: string;
  targetMin: number | null;
  targetMax: number | null;
  status: Status;
  lastDate: string | null;
  note: string;
  category: string;
}

export interface Exam {
  id: string;
  category: string;
  name: string;
  type: string;
  mainRisk: string;
  importance: 'Alta' | 'Média' | 'Baixa';
  suggestedFrequency: string;
  lastDate: string | null;
  nextDate: string | null;
  status: 'Em dia' | 'Próximo' | 'Atrasado' | 'Pendente';
  doctor: string;
  resultSummary: string;
  notes: string;
}

export interface LifestyleData {
  exerciseFrequency: number; // days/week
  sleepHours: number;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholWeekly: number; // drinks/week
}

export interface HealthData {
  biomarkers: Biomarker[];
  exams: Exam[];
  lifestyle: LifestyleData;
  lastUpdated: string;
}

export interface ScoreBreakdown {
  name: string;
  score: number;
  maxPoints: number;
  detail: string;
}

export interface HealthScore {
  value: number;
  status: Status;
  trend: 'up' | 'down' | 'stable';
  breakdown: ScoreBreakdown[];
}
