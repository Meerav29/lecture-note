-- Fix RLS policies for lectures table
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can insert own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can update own lectures" ON lectures;
DROP POLICY IF EXISTS "Users can delete own lectures" ON lectures;

-- Recreate policies
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

-- Verify RLS is enabled
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
