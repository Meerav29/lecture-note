# Background Transcription Pipeline

Long recordings can exceed Vercel's request timeout if we transcribe them inline. The app now uploads audio, creates a lecture record immediately, and queues a background job that runs on Supabase Edge Functions. This document explains how to finish the setup.

## 1. Database Migration

If you created your project before this change, run the following SQL in the Supabase SQL Editor to add the new status columns and the `transcription_jobs` table:

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transcription_status') THEN
    CREATE TYPE transcription_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END$$;

ALTER TABLE lectures
  ADD COLUMN IF NOT EXISTS transcription_status transcription_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS transcription_error TEXT;

CREATE TABLE IF NOT EXISTS transcription_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audio_path TEXT NOT NULL,
  audio_mime_type TEXT,
  status transcription_status NOT NULL DEFAULT 'pending',
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcription_jobs_status_created_at ON transcription_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_transcription_jobs_lecture_id ON transcription_jobs(lecture_id);

ALTER TABLE transcription_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcription jobs"
  ON transcription_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcription jobs"
  ON transcription_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transcription_jobs_updated_at
  BEFORE UPDATE ON transcription_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

> **Note:** `lib/supabase/schema.sql` already includes these definitions for fresh projects. The SQL above is only needed once on existing databases.

## 2. Deploy the Supabase Edge Function

The worker lives in `supabase/functions/transcription-worker`. Deploy it with the Supabase CLI:

```bash
supabase functions deploy transcription-worker --project-ref <your-project-ref>
```

Set the required secrets for the function:

```bash
supabase secrets set SUPABASE_URL="https://<project>.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="service-role-key"
supabase secrets set DEEPGRAM_API_KEY="dg-token"
# Optional if you renamed the storage bucket
supabase secrets set TRANSCRIPTION_AUDIO_BUCKET="lecture-audio"
```

You can test the function locally with:

```bash
supabase functions serve transcription-worker --env-file ../.env.local
```

And invoke it against your project:

```bash
supabase functions invoke transcription-worker --project-ref <your-project-ref> --body '{}'
```

## 3. Schedule the Worker

Use Supabase Scheduled Functions (or any cron service) to call the worker every minute:

```bash
supabase functions schedule create transcription-worker \
  --project-ref <your-project-ref> \
  --cron "* * * * *" \
  --endpoint https://<project>.supabase.co/functions/v1/transcription-worker
```

Alternatively, configure the schedule in the Supabase Dashboard under **Edge Functions → Schedules**.

Each invocation processes up to three queued jobs (`limit` query param). Adjust the schedule or the `limit` parameter to meet your throughput needs.

## 4. Operational Notes

- New lectures show a status badge. Users can leave the page while their transcript is generated.
- Failed jobs capture the Deepgram error message in `lectures.transcription_error`. Fix the underlying issue (e.g., invalid API key or corrupted audio) and re-queue from the dashboard.
- You can manually re-run jobs by deleting failed rows from `transcription_jobs` and clicking "Generate transcript" once that UI lands, or by inserting a new job via `POST /api/transcriptions`.
- Monitor logs by visiting **Supabase → Edge Functions → transcription-worker → Logs**.

With this pipeline active, Vercel never blocks on long Deepgram requests, and lectures always finish processing in the background.
