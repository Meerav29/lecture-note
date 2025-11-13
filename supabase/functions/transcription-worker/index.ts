import { serve } from 'https://deno.land/std@0.214.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1?dts';

interface TranscriptionJob {
  id: string;
  lecture_id: string;
  user_id: string;
  audio_path: string;
  audio_mime_type: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  metadata: Record<string, unknown>;
}

interface DeepgramAlternative {
  transcript?: string;
  confidence?: number;
  paragraphs?: {
    paragraphs?: Array<{
      sentences: Array<{ text: string }>;
    }>;
  };
  summaries?: Array<{ summary?: string }>;
}

interface DeepgramResponse {
  metadata?: {
    request_id?: string;
    model_info?: Record<string, { name?: string }>;
    models?: string[];
    duration?: number;
  };
  results: {
    channels?: Array<{
      alternatives?: DeepgramAlternative[];
      detected_language?: string;
    }>;
    summary?: {
      result?: string;
      short?: string;
    };
  };
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
const AUDIO_BUCKET = Deno.env.get('TRANSCRIPTION_AUDIO_BUCKET') ?? 'lecture-audio';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEEPGRAM_API_KEY) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DEEPGRAM_API_KEY must be configured.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function claimNextJob() {
  const { data: job, error } = await supabase
    .from('transcription_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Worker] Failed to fetch job', error);
    throw error;
  }

  if (!job) {
    return null;
  }

  const { data: updatedJob, error: updateError } = await supabase
    .from('transcription_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      attempts: job.attempts + 1,
      error: null
    })
    .eq('id', job.id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  if (updateError || !updatedJob) {
    console.warn('[Worker] Failed to claim job (race condition likely).', updateError);
    return null;
  }

  return updatedJob as TranscriptionJob;
}

const formatParagraphs = (paragraphGroup: DeepgramAlternative['paragraphs']) => {
  if (!paragraphGroup?.paragraphs?.length) {
    return null;
  }

  const formatted = paragraphGroup.paragraphs
    .map((paragraph) =>
      paragraph.sentences
        .map((sentence) => sentence.text.trim())
        .filter(Boolean)
        .join(' ')
        .trim()
    )
    .filter(Boolean)
    .join('\n\n')
    .trim();

  return formatted || null;
};

const extractSummary = (alternative: DeepgramAlternative | undefined, results: DeepgramResponse['results']) => {
  const alternativeSummary = alternative?.summaries
    ?.map((summary) => summary.summary)
    .filter((value): value is string => Boolean(value))
    .join('\n\n');

  if (alternativeSummary) {
    return alternativeSummary;
  }

  return results.summary?.result || results.summary?.short || undefined;
};

const extractModelName = (metadata: DeepgramResponse['metadata']) => {
  const modelInfoValues = metadata?.model_info ? Object.values(metadata.model_info) : [];

  if (modelInfoValues.length > 0) {
    const [info] = modelInfoValues;
    if (info?.name) {
      return info.name;
    }
  }

  if (metadata?.models?.length) {
    return metadata.models[0];
  }

  return undefined;
};

async function downloadAudio(audioPath: string) {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).download(audioPath);
  if (error || !data) {
    throw new Error(`Unable to download audio file: ${error?.message ?? 'Unknown error'}`);
  }
  return await data.arrayBuffer();
}

async function runDeepgramTranscription(audioBuffer: ArrayBuffer, mimeType?: string | null) {
  const params = new URLSearchParams({
    model: 'nova-3',
    language: 'en',
    summarize: 'v2',
    smart_format: 'true',
    paragraphs: 'true',
    punctuate: 'true'
  });

  const response = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': mimeType ?? 'audio/mpeg'
    },
    body: audioBuffer
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(`Deepgram request failed (${response.status}): ${errorPayload}`);
  }

  return (await response.json()) as DeepgramResponse;
}

async function updateLectureWithTranscript(job: TranscriptionJob, payload: DeepgramResponse) {
  const firstChannel = payload.results.channels?.[0];
  const alternative = firstChannel?.alternatives?.[0];

  if (!alternative) {
    throw new Error('Deepgram returned an empty transcription result.');
  }

  const transcriptFromParagraphs = formatParagraphs(alternative.paragraphs);
  const transcript = (transcriptFromParagraphs ?? alternative.transcript ?? '').trim();

  if (!transcript) {
    throw new Error('Deepgram produced an empty transcript.');
  }

  const { data: lectureRow } = await supabase
    .from('lectures')
    .select('metadata')
    .eq('id', job.lecture_id)
    .single();

  const existingMetadata =
    (lectureRow?.metadata && typeof lectureRow.metadata === 'object' ? lectureRow.metadata : {}) || {};

  const metadata = {
    ...existingMetadata,
    model: extractModelName(payload.metadata),
    duration: payload.metadata?.duration,
    confidence: alternative.confidence,
    language: firstChannel?.detected_language,
    summary: extractSummary(alternative, payload.results),
    deepgram_request_id: payload.metadata?.request_id ?? null
  };

  const { error } = await supabase
    .from('lectures')
    .update({
      transcript,
      duration: metadata.duration ? Math.round(metadata.duration) : null,
      metadata,
      transcription_status: 'completed',
      transcription_error: null
    })
    .eq('id', job.lecture_id);

  if (error) {
    throw error;
  }
}

async function markJobCompleted(job: TranscriptionJob, metadata: Record<string, unknown> = {}) {
  const { error } = await supabase
    .from('transcription_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      error: null,
      metadata: { ...(job.metadata || {}), ...metadata }
    })
    .eq('id', job.id);

  if (error) {
    console.error('[Worker] Failed to mark job completed', error);
    throw error;
  }
}

async function markJobFailed(job: TranscriptionJob, message: string) {
  console.error('[Worker] Job failed', job.id, message);
  await supabase
    .from('transcription_jobs')
    .update({
      status: 'failed',
      error: message,
      completed_at: new Date().toISOString()
    })
    .eq('id', job.id);

  await supabase
    .from('lectures')
    .update({
      transcription_status: 'failed',
      transcription_error: message
    })
    .eq('id', job.lecture_id);
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const batchLimit = Number(url.searchParams.get('limit') ?? '1');
    const limit = Number.isFinite(batchLimit) ? Math.min(Math.max(batchLimit, 1), 3) : 1;
    const processed: Array<{ jobId: string; status: 'completed' | 'failed'; error?: string }> = [];

    for (let i = 0; i < limit; i++) {
      const job = await claimNextJob();
      if (!job) {
        break;
      }

      try {
        const audioBuffer = await downloadAudio(job.audio_path);
        const payload = await runDeepgramTranscription(audioBuffer, job.audio_mime_type);
        await updateLectureWithTranscript(job, payload);
        await markJobCompleted(job, { deepgram_request_id: payload.metadata?.request_id ?? null });
        processed.push({ jobId: job.id, status: 'completed' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown worker error';
        await markJobFailed(job, message);
        processed.push({ jobId: job.id, status: 'failed', error: message });
      }
    }

    if (processed.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'No pending jobs.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ processed: processed.length, jobs: processed }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Worker] Unexpected error', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
