import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '../../../lib/supabase/server';
import { createAdminClient } from '../../../lib/supabase/admin';

export const runtime = 'nodejs';

interface EnqueueRequestBody {
  lectureId?: string;
  audioPath?: string;
  audioMimeType?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EnqueueRequestBody;
    const lectureId = body.lectureId?.trim();
    const audioPath = body.audioPath?.trim();
    const audioMimeType = body.audioMimeType?.trim();

    if (!lectureId || !audioPath) {
      return NextResponse.json({ error: 'lectureId and audioPath are required.' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select('id')
      .eq('id', lectureId)
      .single();

    if (lectureError || !lecture) {
      return NextResponse.json({ error: 'Lecture not found.' }, { status: 404 });
    }

    const adminClient = createAdminClient();

    // Remove any stale pending jobs for this lecture before enqueuing
    await adminClient
      .from('transcription_jobs')
      .delete()
      .eq('lecture_id', lectureId)
      .in('status', ['pending', 'failed']);

    const { data: job, error: insertError } = await adminClient
      .from('transcription_jobs')
      .insert({
        lecture_id: lectureId,
        user_id: user.id,
        audio_path: audioPath,
        audio_mime_type: audioMimeType ?? null,
        status: 'pending',
        error: null
      })
      .select('id, status')
      .single();

    if (insertError || !job) {
      console.error('[Transcriptions] Failed to enqueue job', insertError);
      return NextResponse.json({ error: 'Failed to enqueue transcription job.' }, { status: 500 });
    }

    await adminClient
      .from('lectures')
      .update({ transcription_status: 'pending', transcription_error: null })
      .eq('id', lectureId);

    return NextResponse.json({ jobId: job.id, status: job.status });
  } catch (error) {
    console.error('[Transcriptions] Error enqueuing job', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enqueue transcription job.' },
      { status: 500 }
    );
  }
}
