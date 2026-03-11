import { useHealth } from '@/contexts/HealthContext';
import { Download, RotateCcw, FileJson, FileText } from 'lucide-react';

const Configuracoes = () => {
  const { data, updateData, resetData, exportJSON, exportCSV } = useHealth();

  const handleLifestyleChange = (field: string, value: string | number) => {
    updateData(prev => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seus dados e hábitos</p>
      </div>

      {/* Lifestyle */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-semibold mb-4">Estilo de Vida</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Exercício (dias/semana)</label>
            <input
              type="number" min="0" max="7"
              value={data.lifestyle.exerciseFrequency}
              onChange={e => handleLifestyleChange('exerciseFrequency', parseInt(e.target.value) || 0)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Sono (horas/noite)</label>
            <input
              type="number" min="0" max="14" step="0.5"
              value={data.lifestyle.sleepHours}
              onChange={e => handleLifestyleChange('sleepHours', parseFloat(e.target.value) || 0)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Tabagismo</label>
            <select
              value={data.lifestyle.smokingStatus}
              onChange={e => handleLifestyleChange('smokingStatus', e.target.value)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="never">Nunca fumou</option>
              <option value="former">Ex-fumante</option>
              <option value="current">Fumante</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1.5">Álcool (doses/semana)</label>
            <input
              type="number" min="0" max="50"
              value={data.lifestyle.alcoholWeekly}
              onChange={e => handleLifestyleChange('alcoholWeekly', parseInt(e.target.value) || 0)}
              className="w-full bg-secondary rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-semibold mb-4">Exportar Dados</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors">
            <FileJson className="w-4 h-4" /> Exportar JSON
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-sm font-medium hover:bg-accent transition-colors">
            <FileText className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="font-semibold mb-2">Redefinir Dados</h2>
        <p className="text-sm text-muted-foreground mb-4">Restaura todos os dados para o exemplo inicial. Esta ação não pode ser desfeita.</p>
        <button onClick={() => { if (confirm('Tem certeza? Todos os dados serão substituídos pelo exemplo inicial.')) resetData(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <RotateCcw className="w-4 h-4" /> Redefinir para Dados Iniciais
        </button>
      </div>

      <div className="glass-card rounded-xl p-4 text-xs text-muted-foreground">
        <p><strong>HealthCFO Dashboard v1.0</strong></p>
        <p className="mt-1">Ferramenta de organização pessoal para acompanhamento preventivo de saúde. 
        Não constitui diagnóstico ou recomendação médica. Consulte sempre profissionais de saúde qualificados.</p>
      </div>
    </div>
  );
};

export default Configuracoes;
