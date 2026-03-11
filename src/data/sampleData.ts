import { HealthData } from '@/types/health';

export const sampleData: HealthData = {
  biomarkers: [
    { id: 'pa-sys', name: 'Pressão Arterial (Sistólica)', value: 128, unit: 'mmHg', targetMin: null, targetMax: 120, status: 'yellow', lastDate: '2025-11-15', note: '', category: 'Cardiovascular', history: [
      { value: 130, date: '2025-05-10', note: '' },
      { value: 125, date: '2024-11-12', note: '' },
      { value: 122, date: '2024-05-08', note: '' },
    ]},
    { id: 'pa-dia', name: 'Pressão Arterial (Diastólica)', value: 82, unit: 'mmHg', targetMin: null, targetMax: 80, status: 'yellow', lastDate: '2025-11-15', note: '', category: 'Cardiovascular', history: [
      { value: 84, date: '2025-05-10', note: '' },
      { value: 80, date: '2024-11-12', note: '' },
      { value: 78, date: '2024-05-08', note: '' },
    ]},
    { id: 'glicemia', name: 'Glicemia em Jejum', value: 95, unit: 'mg/dL', targetMin: 70, targetMax: 99, status: 'green', lastDate: '2025-10-20', note: '', category: 'Metabolismo', history: [
      { value: 92, date: '2025-04-15', note: '' },
      { value: 88, date: '2024-10-18', note: '' },
      { value: 90, date: '2024-04-12', note: '' },
    ]},
    { id: 'hba1c', name: 'Hemoglobina Glicada (HbA1c)', value: 5.4, unit: '%', targetMin: null, targetMax: 5.7, status: 'green', lastDate: '2025-10-20', note: '', category: 'Metabolismo', history: [
      { value: 5.3, date: '2025-04-15', note: '' },
      { value: 5.5, date: '2024-10-18', note: '' },
      { value: 5.2, date: '2024-04-12', note: '' },
    ]},
    { id: 'ldl', name: 'LDL Colesterol', value: 135, unit: 'mg/dL', targetMin: null, targetMax: 130, status: 'yellow', lastDate: '2025-10-20', note: 'Ligeiramente elevado', category: 'Cardiovascular', history: [
      { value: 128, date: '2025-04-15', note: '' },
      { value: 142, date: '2024-10-18', note: 'Alto' },
      { value: 138, date: '2024-04-12', note: '' },
    ]},
    { id: 'hdl', name: 'HDL Colesterol', value: 48, unit: 'mg/dL', targetMin: 40, targetMax: null, status: 'green', lastDate: '2025-10-20', note: '', category: 'Cardiovascular', history: [
      { value: 45, date: '2025-04-15', note: '' },
      { value: 42, date: '2024-10-18', note: '' },
      { value: 44, date: '2024-04-12', note: '' },
    ]},
    { id: 'trig', name: 'Triglicerídeos', value: 155, unit: 'mg/dL', targetMin: null, targetMax: 150, status: 'yellow', lastDate: '2025-10-20', note: '', category: 'Cardiovascular', history: [
      { value: 148, date: '2025-04-15', note: '' },
      { value: 165, date: '2024-10-18', note: '' },
      { value: 152, date: '2024-04-12', note: '' },
    ]},
    { id: 'creatinina', name: 'Creatinina', value: 1.0, unit: 'mg/dL', targetMin: 0.7, targetMax: 1.3, status: 'green', lastDate: '2025-10-20', note: '', category: 'Rins', history: [
      { value: 0.95, date: '2025-04-15', note: '' },
      { value: 1.0, date: '2024-10-18', note: '' },
    ]},
    { id: 'ureia', name: 'Ureia', value: 32, unit: 'mg/dL', targetMin: 15, targetMax: 45, status: 'green', lastDate: '2025-10-20', note: '', category: 'Rins', history: [
      { value: 30, date: '2025-04-15', note: '' },
      { value: 34, date: '2024-10-18', note: '' },
    ]},
    { id: 'tsh', name: 'TSH', value: 2.5, unit: 'mUI/L', targetMin: 0.4, targetMax: 4.0, status: 'green', lastDate: '2025-10-20', note: '', category: 'Hormonal', history: [
      { value: 2.8, date: '2025-04-15', note: '' },
      { value: 2.3, date: '2024-10-18', note: '' },
    ]},
    { id: 't4livre', name: 'T4 Livre', value: 1.2, unit: 'ng/dL', targetMin: 0.8, targetMax: 1.8, status: 'green', lastDate: '2025-10-20', note: '', category: 'Hormonal', history: [
      { value: 1.1, date: '2025-04-15', note: '' },
      { value: 1.3, date: '2024-10-18', note: '' },
    ]},
    { id: 'tgo', name: 'TGO (AST)', value: 28, unit: 'U/L', targetMin: null, targetMax: 40, status: 'green', lastDate: '2025-10-20', note: '', category: 'Fígado', history: [
      { value: 25, date: '2025-04-15', note: '' },
      { value: 30, date: '2024-10-18', note: '' },
    ]},
    { id: 'tgp', name: 'TGP (ALT)', value: 35, unit: 'U/L', targetMin: null, targetMax: 41, status: 'green', lastDate: '2025-10-20', note: '', category: 'Fígado', history: [
      { value: 32, date: '2025-04-15', note: '' },
      { value: 38, date: '2024-10-18', note: '' },
    ]},
    { id: 'ggt', name: 'GGT', value: 45, unit: 'U/L', targetMin: null, targetMax: 60, status: 'green', lastDate: '2025-10-20', note: '', category: 'Fígado', history: [
      { value: 42, date: '2025-04-15', note: '' },
      { value: 48, date: '2024-10-18', note: '' },
    ]},
    { id: 'vitd', name: 'Vitamina D', value: 28, unit: 'ng/mL', targetMin: 30, targetMax: 100, status: 'yellow', lastDate: '2025-10-20', note: 'Suplementar', category: 'Hormonal', history: [
      { value: 22, date: '2025-04-15', note: 'Deficiente' },
      { value: 25, date: '2024-10-18', note: '' },
      { value: 18, date: '2024-04-12', note: 'Muito baixo' },
    ]},
    { id: 'vitb12', name: 'Vitamina B12', value: 450, unit: 'pg/mL', targetMin: 200, targetMax: 900, status: 'green', lastDate: '2025-10-20', note: '', category: 'Metabolismo', history: [
      { value: 420, date: '2025-04-15', note: '' },
      { value: 380, date: '2024-10-18', note: '' },
    ]},
    { id: 'ferritina', name: 'Ferritina', value: 120, unit: 'ng/mL', targetMin: 30, targetMax: 300, status: 'green', lastDate: '2025-10-20', note: '', category: 'Metabolismo', history: [
      { value: 110, date: '2025-04-15', note: '' },
      { value: 95, date: '2024-10-18', note: '' },
    ]},
    { id: 'psa', name: 'PSA', value: 0.8, unit: 'ng/mL', targetMin: null, targetMax: 4.0, status: 'green', lastDate: '2025-10-20', note: '', category: 'Urologia', history: [
      { value: 0.7, date: '2025-04-15', note: '' },
      { value: 0.6, date: '2024-10-18', note: '' },
    ]},
    { id: 'imc', name: 'IMC', value: 26.5, unit: 'kg/m²', targetMin: 18.5, targetMax: 24.9, status: 'yellow', lastDate: '2025-11-15', note: 'Sobrepeso leve', category: 'Composição Corporal', history: [
      { value: 27.0, date: '2025-05-10', note: '' },
      { value: 27.8, date: '2024-11-12', note: '' },
      { value: 28.2, date: '2024-05-08', note: '' },
    ]},
    { id: 'cintura', name: 'Circunferência Abdominal', value: 94, unit: 'cm', targetMin: null, targetMax: 94, status: 'yellow', lastDate: '2025-11-15', note: 'No limite', category: 'Composição Corporal', history: [
      { value: 96, date: '2025-05-10', note: '' },
      { value: 98, date: '2024-11-12', note: '' },
      { value: 99, date: '2024-05-08', note: '' },
    ]},
    { id: 'testosterona', name: 'Testosterona Total', value: 520, unit: 'ng/dL', targetMin: 300, targetMax: 1000, status: 'green', lastDate: '2025-10-20', note: '', category: 'Hormonal', history: [
      { value: 510, date: '2025-04-15', note: '' },
      { value: 495, date: '2024-10-18', note: '' },
    ]},
    { id: 'pcr', name: 'PCR Ultrassensível', value: 1.8, unit: 'mg/L', targetMin: null, targetMax: 1.0, status: 'yellow', lastDate: '2025-10-20', note: 'Inflamação leve', category: 'Cardiovascular', history: [
      { value: 2.1, date: '2025-04-15', note: '' },
      { value: 1.5, date: '2024-10-18', note: '' },
    ]},
    { id: 'apob', name: 'Apolipoproteína B', value: 105, unit: 'mg/dL', targetMin: null, targetMax: 90, status: 'yellow', lastDate: '2025-10-20', note: '', category: 'Cardiovascular', history: [
      { value: 100, date: '2025-04-15', note: '' },
      { value: 95, date: '2024-10-18', note: '' },
    ]},
    { id: 'insulina', name: 'Insulina em Jejum', value: 8, unit: 'µUI/mL', targetMin: 2, targetMax: 13, status: 'green', lastDate: '2025-10-20', note: '', category: 'Metabolismo', history: [
      { value: 9, date: '2025-04-15', note: '' },
      { value: 7, date: '2024-10-18', note: '' },
    ]},
  ],
  exams: [
    { id: 'e1', category: 'Geral', name: 'Consulta com Clínico', type: 'Consulta', mainRisk: 'Prevenção geral', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-11-15', nextDate: '2026-11-15', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: 'Sem alterações', notes: '' },
    { id: 'e2', category: 'Cardiovascular', name: 'Pressão Arterial', type: 'Medição', mainRisk: 'Hipertensão', importance: 'Alta', suggestedFrequency: 'Semestral', lastDate: '2025-11-15', nextDate: '2026-05-15', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '128/82 mmHg', notes: 'Atenção' },
    { id: 'e3', category: 'Geral', name: 'Hemograma Completo', type: 'Laboratório', mainRisk: 'Anemia, infecções', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: 'Normal', notes: '' },
    { id: 'e4', category: 'Metabolismo', name: 'Glicemia em Jejum', type: 'Laboratório', mainRisk: 'Diabetes', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '95 mg/dL', notes: '' },
    { id: 'e5', category: 'Metabolismo', name: 'Hemoglobina Glicada', type: 'Laboratório', mainRisk: 'Diabetes', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '5.4%', notes: '' },
    { id: 'e6', category: 'Metabolismo', name: 'Insulina em Jejum', type: 'Laboratório', mainRisk: 'Resistência insulínica', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '8 µUI/mL', notes: '' },
    { id: 'e7', category: 'Cardiovascular', name: 'Perfil Lipídico', type: 'Laboratório', mainRisk: 'Dislipidemia', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: 'LDL 135, HDL 48', notes: 'LDL elevado' },
    { id: 'e8', category: 'Cardiovascular', name: 'Apolipoproteína B', type: 'Laboratório', mainRisk: 'Risco aterosclerose', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '105 mg/dL', notes: 'Elevado' },
    { id: 'e9', category: 'Cardiovascular', name: 'PCR Ultrassensível', type: 'Laboratório', mainRisk: 'Inflamação vascular', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '1.8 mg/L', notes: 'Elevado' },
    { id: 'e10', category: 'Rins', name: 'Creatinina', type: 'Laboratório', mainRisk: 'Insuficiência renal', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '1.0 mg/dL', notes: '' },
    { id: 'e11', category: 'Rins', name: 'Ureia', type: 'Laboratório', mainRisk: 'Função renal', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '32 mg/dL', notes: '' },
    { id: 'e12', category: 'Rins', name: 'Urina Tipo 1', type: 'Laboratório', mainRisk: 'Infecção, cálculos', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: 'Normal', notes: '' },
    { id: 'e13', category: 'Rins', name: 'Microalbuminúria', type: 'Laboratório', mainRisk: 'Nefropatia', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: 'Normal', notes: '' },
    { id: 'e14', category: 'Fígado', name: 'TGO (AST)', type: 'Laboratório', mainRisk: 'Doença hepática', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '28 U/L', notes: '' },
    { id: 'e15', category: 'Fígado', name: 'TGP (ALT)', type: 'Laboratório', mainRisk: 'Doença hepática', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '35 U/L', notes: '' },
    { id: 'e16', category: 'Fígado', name: 'GGT', type: 'Laboratório', mainRisk: 'Doença hepática / álcool', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '45 U/L', notes: '' },
    { id: 'e17', category: 'Hormonal', name: 'TSH', type: 'Laboratório', mainRisk: 'Tireoide', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '2.5 mUI/L', notes: '' },
    { id: 'e18', category: 'Hormonal', name: 'T4 Livre', type: 'Laboratório', mainRisk: 'Tireoide', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '1.2 ng/dL', notes: '' },
    { id: 'e19', category: 'Hormonal', name: 'Testosterona Total', type: 'Laboratório', mainRisk: 'Hipogonadismo', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '520 ng/dL', notes: '' },
    { id: 'e20', category: 'Hormonal', name: 'Vitamina D', type: 'Laboratório', mainRisk: 'Deficiência', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '28 ng/mL', notes: 'Insuficiente' },
    { id: 'e21', category: 'Metabolismo', name: 'Vitamina B12', type: 'Laboratório', mainRisk: 'Deficiência', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '450 pg/mL', notes: '' },
    { id: 'e22', category: 'Metabolismo', name: 'Ferritina', type: 'Laboratório', mainRisk: 'Anemia / Sobrecarga', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: '120 ng/mL', notes: '' },
    { id: 'e23', category: 'Cardiovascular', name: 'Eletrocardiograma', type: 'Exame', mainRisk: 'Arritmia', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-11-15', nextDate: '2026-11-15', status: 'Em dia', doctor: 'Dr. Cardoso', resultSummary: 'Normal', notes: '' },
    { id: 'e24', category: 'Cardiovascular', name: 'Teste Ergométrico', type: 'Exame', mainRisk: 'Isquemia', importance: 'Alta', suggestedFrequency: 'A cada 2 anos', lastDate: '2024-08-10', nextDate: '2026-08-10', status: 'Em dia', doctor: 'Dr. Cardoso', resultSummary: 'Normal', notes: '' },
    { id: 'e25', category: 'Cardiovascular', name: 'Ecocardiograma', type: 'Exame', mainRisk: 'Cardiopatia', importance: 'Média', suggestedFrequency: 'A cada 3 anos', lastDate: '2024-08-10', nextDate: '2027-08-10', status: 'Em dia', doctor: 'Dr. Cardoso', resultSummary: 'Normal', notes: '' },
    { id: 'e26', category: 'Cardiovascular', name: 'Score de Cálcio Coronariano', type: 'Exame', mainRisk: 'Aterosclerose', importance: 'Média', suggestedFrequency: 'A cada 5 anos', lastDate: null, nextDate: null, status: 'Pendente', doctor: '', resultSummary: '', notes: 'Ainda não realizado' },
    { id: 'e27', category: 'Geral', name: 'Ultrassom Abdominal', type: 'Exame', mainRisk: 'Esteatose, cálculos', importance: 'Média', suggestedFrequency: 'A cada 2 anos', lastDate: '2024-03-05', nextDate: '2026-03-05', status: 'Atrasado', doctor: 'Dr. Silva', resultSummary: 'Esteatose grau I', notes: 'Repetir' },
    { id: 'e28', category: 'Urologia', name: 'PSA', type: 'Laboratório', mainRisk: 'Câncer de próstata', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2025-10-20', nextDate: '2026-10-20', status: 'Em dia', doctor: 'Dr. Urologia', resultSummary: '0.8 ng/mL', notes: '' },
    { id: 'e29', category: 'Pele', name: 'Consulta Dermatológica', type: 'Consulta', mainRisk: 'Câncer de pele', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2024-06-10', nextDate: '2025-06-10', status: 'Atrasado', doctor: '', resultSummary: '', notes: 'Agendar' },
    { id: 'e30', category: 'Visão', name: 'Consulta Oftalmológica', type: 'Consulta', mainRisk: 'Glaucoma, degeneração', importance: 'Alta', suggestedFrequency: 'Anual', lastDate: '2024-09-15', nextDate: '2025-09-15', status: 'Atrasado', doctor: '', resultSummary: '', notes: 'Agendar' },
    { id: 'e31', category: 'Composição Corporal', name: 'Bioimpedância Corporal', type: 'Exame', mainRisk: 'Obesidade', importance: 'Média', suggestedFrequency: 'Anual', lastDate: '2025-11-15', nextDate: '2026-11-15', status: 'Em dia', doctor: 'Dr. Silva', resultSummary: 'IMC 26.5', notes: '' },
  ],
  lifestyle: {
    exerciseFrequency: 3,
    sleepHours: 7,
    smokingStatus: 'never',
    alcoholWeekly: 4,
    dailySteps: 0,
    avgHeartRate: 0,
    activityMinutes: 0,
    weight: null,
  },
  lastUpdated: '2025-11-15',
};
