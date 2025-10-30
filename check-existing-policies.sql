-- Run this in Supabase SQL Editor to see what policies currently exist

-- Check policies on lectures table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'lectures';

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('lectures', 'lecture_content', 'lecture_chats');

-- Check storage policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
