-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE (default)

-- biomarkers
DROP POLICY IF EXISTS "Users can view own biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Users can insert own biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Users can update own biomarkers" ON public.biomarkers;
DROP POLICY IF EXISTS "Users can delete own biomarkers" ON public.biomarkers;

CREATE POLICY "Users can view own biomarkers" ON public.biomarkers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own biomarkers" ON public.biomarkers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own biomarkers" ON public.biomarkers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own biomarkers" ON public.biomarkers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- biomarker_history
DROP POLICY IF EXISTS "Users can view own biomarker history" ON public.biomarker_history;
DROP POLICY IF EXISTS "Users can insert own biomarker history" ON public.biomarker_history;
DROP POLICY IF EXISTS "Users can update own biomarker history" ON public.biomarker_history;
DROP POLICY IF EXISTS "Users can delete own biomarker history" ON public.biomarker_history;

CREATE POLICY "Users can view own biomarker history" ON public.biomarker_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own biomarker history" ON public.biomarker_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own biomarker history" ON public.biomarker_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own biomarker history" ON public.biomarker_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- exams
DROP POLICY IF EXISTS "Users can view own exams" ON public.exams;
DROP POLICY IF EXISTS "Users can insert own exams" ON public.exams;
DROP POLICY IF EXISTS "Users can update own exams" ON public.exams;
DROP POLICY IF EXISTS "Users can delete own exams" ON public.exams;

CREATE POLICY "Users can view own exams" ON public.exams FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exams" ON public.exams FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.exams FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.exams FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- lifestyle_data
DROP POLICY IF EXISTS "Users can view own lifestyle" ON public.lifestyle_data;
DROP POLICY IF EXISTS "Users can insert own lifestyle" ON public.lifestyle_data;
DROP POLICY IF EXISTS "Users can update own lifestyle" ON public.lifestyle_data;

CREATE POLICY "Users can view own lifestyle" ON public.lifestyle_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lifestyle" ON public.lifestyle_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lifestyle" ON public.lifestyle_data FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lifestyle" ON public.lifestyle_data FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- chat_conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.chat_conversations;

CREATE POLICY "Users can view own conversations" ON public.chat_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.chat_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.chat_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.chat_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- chat_messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;

CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);