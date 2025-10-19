'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { createClient } from '../../../lib/supabase/client';
import type { Lecture, LectureContent } from '../../../lib/supabase/types';
import { LectureLayout } from '../../../components/lecture/LectureLayout';

export default function LecturePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [contents, setContents] = useState<Record<string, LectureContent>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const lectureId = params.id as string;

  useEffect(() => {
    if (user && lectureId) {
      fetchLecture();
      fetchContents();
    }
  }, [user, lectureId]);

  const fetchLecture = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('id', lectureId)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Lecture not found');
        return;
      }

      setLecture(data);
    } catch (err) {
      console.error('Error fetching lecture:', err);
      setError('Failed to load lecture');
    } finally {
      setLoading(false);
    }
  };

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('lecture_content')
        .select('*')
        .eq('lecture_id', lectureId);

      if (error) throw error;

      // Convert array to object keyed by content_type
      const contentsMap: Record<string, LectureContent> = {};
      data?.forEach((content) => {
        contentsMap[content.content_type] = content;
      });

      setContents(contentsMap);
    } catch (err) {
      console.error('Error fetching contents:', err);
    }
  };

  const handleContentUpdate = (contentType: string, content: LectureContent) => {
    setContents((prev) => ({
      ...prev,
      [contentType]: content
    }));
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--text-muted)'
        }}
      >
        Loading lecture...
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem'
        }}
      >
        <p style={{ color: 'var(--status-error)', fontSize: '1.125rem' }}>
          {error || 'Lecture not found'}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--accent-gradient)',
            color: 'var(--accent-text-contrast)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <LectureLayout
      lecture={lecture}
      contents={contents}
      onContentUpdate={handleContentUpdate}
      onLectureUpdate={setLecture}
    />
  );
}
