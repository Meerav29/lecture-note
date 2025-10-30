-- Storage policies for lecture-audio bucket
-- Run this AFTER creating the bucket in the Storage UI

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload own audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lecture-audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to view their own files
CREATE POLICY "Users can view own audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lecture-audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own files
CREATE POLICY "Users can update own audio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lecture-audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lecture-audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

SELECT 'Storage policies created successfully!' as status;
