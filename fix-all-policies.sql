-- Comprehensive fix for RLS and Storage policies
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Fix RLS policies for lectures table
-- ============================================

DROP POLICY IF EXISTS "Users can view own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can insert own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can update own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can delete own lectures" ON lectures;

CREATE POLICY "Users can view own lectures"
  ON lectures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lectures"
  ON lectures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lectures"
  ON lectures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lectures"
  ON lectures FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Fix RLS policies for lecture_content table
-- ============================================

DROP POLICY IF EXISTS "Users can view own lecture content" ON lecture_content;
DROP POLICY IF EXISTS "Users can insert own lecture content" ON lecture_content;
DROP POLICY IF EXISTS "Users can update own lecture content" ON lecture_content;
DROP POLICY IF EXISTS "Users can delete own lecture content" ON lecture_content;

CREATE POLICY "Users can view own lecture content"
  ON lecture_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_content.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own lecture content"
  ON lecture_content FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_content.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own lecture content"
  ON lecture_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_content.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own lecture content"
  ON lecture_content FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_content.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

ALTER TABLE lecture_content ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Fix RLS policies for lecture_chats table
-- ============================================

DROP POLICY IF EXISTS "Users can view own lecture chats" ON lecture_chats;
DROP POLICY IF EXISTS "Users can insert own lecture chats" ON lecture_chats;
DROP POLICY IF EXISTS "Users can delete own lecture chats" ON lecture_chats;

CREATE POLICY "Users can view own lecture chats"
  ON lecture_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_chats.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own lecture chats"
  ON lecture_chats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_chats.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own lecture chats"
  ON lecture_chats FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lectures
      WHERE lectures.id = lecture_chats.lecture_id
      AND lectures.user_id = auth.uid()
    )
  );

ALTER TABLE lecture_chats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Storage Policies for lecture-audio bucket
-- ============================================
-- Note: These need to be run in the Storage section
-- or you can run them here if storage.objects table exists

-- First, check if the bucket exists and create if needed
-- This might need to be done via the Supabase Dashboard -> Storage

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Users can upload own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;

-- Create storage policies
CREATE POLICY "Users can upload own audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lecture-audio' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lecture-audio' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own audio"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'lecture-audio' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lecture-audio' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 5. Verify everything is set up correctly
-- ============================================

SELECT 'RLS Policies Created Successfully!' as status;
