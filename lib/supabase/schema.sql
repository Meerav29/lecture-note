-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  audio_url TEXT,
  transcript TEXT,
  duration INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lecture content table (notes, flashcards, mindmap, summary)
CREATE TABLE IF NOT EXISTS lecture_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('notes', 'flashcards', 'mindmap', 'summary')),
  content JSONB NOT NULL,
  provider TEXT CHECK (provider IN ('openai', 'anthropic')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lecture_id, content_type)
);

-- Lecture chat messages
CREATE TABLE IF NOT EXISTS lecture_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('openai', 'anthropic')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lectures_user_id ON lectures(user_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_at ON lectures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lecture_content_lecture_id ON lecture_content(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_chats_lecture_id ON lecture_chats(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_chats_created_at ON lecture_chats(created_at);

-- Enable Row Level Security
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lectures
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

-- RLS Policies for lecture_content
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

-- RLS Policies for lecture_chats
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

-- Storage bucket for audio files
-- Run this in the Supabase Storage interface or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('lecture-audio', 'lecture-audio', false);

-- Storage policies (replace 'lecture-audio' with your bucket name)
-- CREATE POLICY "Users can upload own audio"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'lecture-audio' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can view own audio"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'lecture-audio' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can delete own audio"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'lecture-audio' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_lectures_updated_at
  BEFORE UPDATE ON lectures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lecture_content_updated_at
  BEFORE UPDATE ON lecture_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
