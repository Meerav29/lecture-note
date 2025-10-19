'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Lecture, LectureContent } from '../../lib/supabase/types';
import { createClient } from '../../lib/supabase/client';

interface MindmapViewProps {
  lecture: Lecture;
  content: LectureContent | undefined;
  onContentUpdate: (content: LectureContent) => void;
}

export function MindmapView({ lecture, content, onContentUpdate }: MindmapViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const generateMindmap = async () => {
    if (!lecture.transcript) {
      setError('No transcript available');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          transcript: lecture.transcript,
          mode: 'mindmap'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate mindmap');

      const { data: savedContent, error: dbError } = await supabase
        .from('lecture_content')
        .upsert({
          lecture_id: lecture.id,
          content_type: 'mindmap',
          content: data.output,
          provider
        })
        .select()
        .single();

      if (dbError) throw dbError;
      onContentUpdate(savedContent);
    } catch (err) {
      console.error('Error generating mindmap:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate mindmap');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!content && !isGenerating) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1.5rem',
          padding: '2rem'
        }}
      >
        <div style={{ fontSize: '4rem' }}>🗺️</div>
        <h3 style={{ fontSize: '1.5rem', margin: 0 }}>No Mind Map Yet</h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '500px' }}>
          Generate a hierarchical mind map of your lecture to visualize the structure and relationships between topics.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'openai' | 'anthropic')}
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-stronger)',
              background: 'var(--surface-input)',
              color: 'var(--text-secondary)',
              fontSize: '1rem'
            }}
          >
            <option value="openai">ChatGPT (OpenAI)</option>
            <option value="anthropic">Claude (Anthropic)</option>
          </select>

          <button
            onClick={generateMindmap}
            disabled={!lecture.transcript}
            style={{
              padding: '1rem 2rem',
              borderRadius: '999px',
              border: 'none',
              background: lecture.transcript ? 'var(--accent-gradient-alt)' : 'var(--accent-gradient-muted)',
              color: 'var(--accent-text-contrast)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: lecture.transcript ? 'pointer' : 'not-allowed'
            }}
          >
            Generate Mind Map
          </button>
        </div>

        {error && <p style={{ color: 'var(--status-error)', fontSize: '0.9rem' }}>{error}</p>}
      </div>
    );
  }

  if (isGenerating) {
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
        <div
          style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--surface-panel-faint)',
            borderTop: '4px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Generating mind map...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div
        style={{
          background: 'var(--surface-panel)',
          borderRadius: '1rem',
          padding: '2rem',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-panel)'
        }}
      >
        <div
          style={{
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Mind Map</h2>
          <button
            onClick={generateMindmap}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-strong)',
              background: 'var(--surface-panel-faint)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔄 Regenerate
          </button>
        </div>

        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {typeof content?.content === 'string' ? content.content : ''}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
