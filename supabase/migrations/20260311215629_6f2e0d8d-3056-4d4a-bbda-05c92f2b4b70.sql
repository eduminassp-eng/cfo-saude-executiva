
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Biomarkers table
CREATE TABLE public.biomarkers (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC,
  unit TEXT NOT NULL DEFAULT '',
  target_min NUMERIC,
  target_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('green', 'yellow', 'red', 'unknown')),
  last_date DATE,
  note TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.biomarkers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own biomarkers" ON public.biomarkers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own biomarkers" ON public.biomarkers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own biomarkers" ON public.biomarkers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own biomarkers" ON public.biomarkers FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_biomarkers_updated_at BEFORE UPDATE ON public.biomarkers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Biomarker history table
CREATE TABLE public.biomarker_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biomarker_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.biomarker_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own biomarker history" ON public.biomarker_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own biomarker history" ON public.biomarker_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own biomarker history" ON public.biomarker_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own biomarker history" ON public.biomarker_history FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_biomarker_history_user_biomarker ON public.biomarker_history(user_id, biomarker_id);

-- Exams table
CREATE TABLE public.exams (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  main_risk TEXT NOT NULL DEFAULT '',
  importance TEXT NOT NULL DEFAULT 'Média' CHECK (importance IN ('Alta', 'Média', 'Baixa')),
  suggested_frequency TEXT NOT NULL DEFAULT '',
  last_date DATE,
  next_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Em dia', 'Próximo', 'Atrasado', 'Pendente')),
  doctor TEXT NOT NULL DEFAULT '',
  result_summary TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own exams" ON public.exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exams" ON public.exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.exams FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lifestyle data table
CREATE TABLE public.lifestyle_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_frequency INTEGER NOT NULL DEFAULT 0,
  sleep_hours NUMERIC NOT NULL DEFAULT 7,
  smoking_status TEXT NOT NULL DEFAULT 'never' CHECK (smoking_status IN ('never', 'former', 'current')),
  alcohol_weekly INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lifestyle_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own lifestyle" ON public.lifestyle_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lifestyle" ON public.lifestyle_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lifestyle" ON public.lifestyle_data FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_lifestyle_updated_at BEFORE UPDATE ON public.lifestyle_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
