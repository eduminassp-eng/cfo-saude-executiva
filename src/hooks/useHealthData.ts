import { useState, useEffect, useCallback } from 'react';
import { HealthData, Biomarker, Exam, LifestyleData, BiomarkerHistoryEntry } from '@/types/health';
import { sampleData } from '@/data/sampleData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EMPTY_DATA: HealthData = {
  biomarkers: [],
  exams: [],
  lifestyle: { exerciseFrequency: 0, sleepHours: 7, smokingStatus: 'never', alcoholWeekly: 0, dailySteps: 0, avgHeartRate: 0, activityMinutes: 0, weight: null },
  lastUpdated: new Date().toISOString().split('T')[0],
};

export function useHealthData() {
  const { user } = useAuth();
  const [data, setData] = useState<HealthData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    if (!user) { setData(EMPTY_DATA); setLoading(false); setError(null); return; }
    
    setError(null);
    try {
      // Check if user has data
      const { data: biomarkers, error: bErr } = await supabase
        .from('biomarkers')
        .select('*')
        .eq('user_id', user.id);
      if (bErr) throw bErr;

      // If no data, seed with sample data
      if (!biomarkers || biomarkers.length === 0) {
        await seedSampleData(user.id);
        return loadData(); // reload after seeding
      }

      // Load history for all biomarkers
      const { data: historyRows } = await supabase
        .from('biomarker_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const historyMap = new Map<string, BiomarkerHistoryEntry[]>();
      (historyRows || []).forEach(h => {
        const arr = historyMap.get(h.biomarker_id) || [];
        arr.push({ value: h.value, date: h.date, note: h.note });
        historyMap.set(h.biomarker_id, arr);
      });

      const mappedBiomarkers: Biomarker[] = biomarkers.map(b => ({
        id: b.id,
        name: b.name,
        value: b.value,
        unit: b.unit,
        targetMin: b.target_min,
        targetMax: b.target_max,
        status: b.status as Biomarker['status'],
        lastDate: b.last_date,
        note: b.note,
        category: b.category,
        history: historyMap.get(b.id) || [],
      }));

      const { data: exams } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id);

      const mappedExams: Exam[] = (exams || []).map(e => ({
        id: e.id,
        category: e.category,
        name: e.name,
        type: e.type,
        mainRisk: e.main_risk,
        importance: e.importance as Exam['importance'],
        suggestedFrequency: e.suggested_frequency,
        lastDate: e.last_date,
        nextDate: e.next_date,
        status: e.status as Exam['status'],
        doctor: e.doctor,
        resultSummary: e.result_summary,
        notes: e.notes,
      }));

      const { data: lifestyle } = await supabase
        .from('lifestyle_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const mappedLifestyle: LifestyleData = lifestyle ? {
        exerciseFrequency: lifestyle.exercise_frequency,
        sleepHours: lifestyle.sleep_hours,
        smokingStatus: lifestyle.smoking_status as LifestyleData['smokingStatus'],
        alcoholWeekly: lifestyle.alcohol_weekly,
        dailySteps: (lifestyle as any).daily_steps ?? 0,
        avgHeartRate: (lifestyle as any).avg_heart_rate ?? 0,
        activityMinutes: (lifestyle as any).activity_minutes ?? 0,
        weight: (lifestyle as any).weight ?? null,
      } : EMPTY_DATA.lifestyle;

      const { data: profile } = await supabase
        .from('profiles')
        .select('last_updated')
        .eq('user_id', user.id)
        .maybeSingle();

      setData({
        biomarkers: mappedBiomarkers,
        exams: mappedExams,
        lifestyle: mappedLifestyle,
        lastUpdated: profile?.last_updated || new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      console.error('Error loading health data:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateData = useCallback(async (updater: (prev: HealthData) => HealthData) => {
    if (!user) return;
    
    const prev = data;
    const next = updater(prev);
    next.lastUpdated = new Date().toISOString().split('T')[0];
    setData(next); // optimistic

    try {
      // Sync biomarkers
      await supabase.from('biomarkers').delete().eq('user_id', user.id);
      if (next.biomarkers.length > 0) {
        const { error } = await supabase.from('biomarkers').insert(
          next.biomarkers.map(b => ({
            id: b.id,
            user_id: user.id,
            name: b.name,
            value: b.value,
            unit: b.unit,
            target_min: b.targetMin,
            target_max: b.targetMax,
            status: b.status,
            last_date: b.lastDate,
            note: b.note,
            category: b.category,
          }))
        );
        if (error) throw error;
      }

      // Sync biomarker history
      await supabase.from('biomarker_history').delete().eq('user_id', user.id);
      const historyRows = next.biomarkers.flatMap(b =>
        b.history.map(h => ({
          biomarker_id: b.id,
          user_id: user.id,
          value: h.value,
          date: h.date,
          note: h.note,
        }))
      );
      if (historyRows.length > 0) {
        const { error } = await supabase.from('biomarker_history').insert(historyRows);
        if (error) throw error;
      }

      // Sync exams
      await supabase.from('exams').delete().eq('user_id', user.id);
      if (next.exams.length > 0) {
        const { error } = await supabase.from('exams').insert(
          next.exams.map(e => ({
            id: e.id,
            user_id: user.id,
            category: e.category,
            name: e.name,
            type: e.type,
            main_risk: e.mainRisk,
            importance: e.importance,
            suggested_frequency: e.suggestedFrequency,
            last_date: e.lastDate,
            next_date: e.nextDate,
            status: e.status,
            doctor: e.doctor,
            result_summary: e.resultSummary,
            notes: e.notes,
          }))
        );
        if (error) throw error;
      }

      // Sync lifestyle
      const { error: lErr } = await supabase.from('lifestyle_data').upsert({
        user_id: user.id,
        exercise_frequency: next.lifestyle.exerciseFrequency,
        sleep_hours: next.lifestyle.sleepHours,
        smoking_status: next.lifestyle.smokingStatus,
        alcohol_weekly: next.lifestyle.alcoholWeekly,
        daily_steps: next.lifestyle.dailySteps,
        avg_heart_rate: next.lifestyle.avgHeartRate,
        activity_minutes: next.lifestyle.activityMinutes,
        weight: next.lifestyle.weight,
      } as any, { onConflict: 'user_id' });
      if (lErr) throw lErr;

      // Update profile timestamp
      await supabase.from('profiles').update({ last_updated: next.lastUpdated }).eq('user_id', user.id);

    } catch (err: any) {
      console.error('Error saving health data:', err);
      toast.error('Erro ao salvar dados');
      setData(prev); // rollback
    }
  }, [user, data]);

  const resetData = useCallback(async () => {
    if (!user) return;
    try {
      await Promise.all([
        supabase.from('biomarker_history').delete().eq('user_id', user.id),
        supabase.from('biomarkers').delete().eq('user_id', user.id),
        supabase.from('exams').delete().eq('user_id', user.id),
        supabase.from('lifestyle_data').delete().eq('user_id', user.id),
      ]);
      await seedSampleData(user.id);
      await loadData();
      toast.success('Dados restaurados com sucesso');
    } catch (err: any) {
      console.error('Error resetting data:', err);
      toast.error('Erro ao restaurar dados');
    }
  }, [user, loadData]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-cfo-${data.lastUpdated}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const exportCSV = useCallback(() => {
    const headers = ['Nome', 'Valor', 'Unidade', 'Status', 'Última Data', 'Nota'];
    const rows = data.biomarkers.map(b => [
      b.name, b.value?.toString() ?? '', b.unit, b.status, b.lastDate ?? '', b.note
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-cfo-${data.lastUpdated}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return { data, loading, updateData, resetData, exportJSON, exportCSV };
}

async function seedSampleData(userId: string) {
  // Insert biomarkers
  const { error: bErr } = await supabase.from('biomarkers').insert(
    sampleData.biomarkers.map(b => ({
      id: b.id,
      user_id: userId,
      name: b.name,
      value: b.value,
      unit: b.unit,
      target_min: b.targetMin,
      target_max: b.targetMax,
      status: b.status,
      last_date: b.lastDate,
      note: b.note,
      category: b.category,
    }))
  );
  if (bErr) throw bErr;

  // Insert history
  const historyRows = sampleData.biomarkers.flatMap(b =>
    b.history.map(h => ({
      biomarker_id: b.id,
      user_id: userId,
      value: h.value,
      date: h.date,
      note: h.note,
    }))
  );
  if (historyRows.length > 0) {
    const { error } = await supabase.from('biomarker_history').insert(historyRows);
    if (error) throw error;
  }

  // Insert exams
  const { error: eErr } = await supabase.from('exams').insert(
    sampleData.exams.map(e => ({
      id: e.id,
      user_id: userId,
      category: e.category,
      name: e.name,
      type: e.type,
      main_risk: e.mainRisk,
      importance: e.importance,
      suggested_frequency: e.suggestedFrequency,
      last_date: e.lastDate,
      next_date: e.nextDate,
      status: e.status,
      doctor: e.doctor,
      result_summary: e.resultSummary,
      notes: e.notes,
    }))
  );
  if (eErr) throw eErr;

  // Insert lifestyle
  const { error: lErr } = await supabase.from('lifestyle_data').upsert({
    user_id: userId,
    exercise_frequency: sampleData.lifestyle.exerciseFrequency,
    sleep_hours: sampleData.lifestyle.sleepHours,
    smoking_status: sampleData.lifestyle.smokingStatus,
    alcohol_weekly: sampleData.lifestyle.alcoholWeekly,
  }, { onConflict: 'user_id' });
  if (lErr) throw lErr;

  // Update profile timestamp
  await supabase.from('profiles').update({ last_updated: sampleData.lastUpdated }).eq('user_id', userId);
}
