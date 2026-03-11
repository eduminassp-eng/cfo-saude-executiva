INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', false);

CREATE POLICY "Users can upload lab reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lab-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own lab reports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lab-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own lab reports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lab-reports' AND (storage.foldername(name))[1] = auth.uid()::text);