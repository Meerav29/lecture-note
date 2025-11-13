'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Lecture, LectureContent } from '../../lib/supabase/types';
import { createClient } from '../../lib/supabase/client';

interface NotesViewProps {
  lecture: Lecture;
  content: LectureContent | undefined;
  onContentUpdate: (content: LectureContent) => void;
}

export function NotesView({ lecture, content, onContentUpdate }: NotesViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (content?.content) {
      setEditText(typeof content.content === 'string' ? content.content : JSON.stringify(content.content));
    }
  }, [content]);

  const saveNotes = useCallback(
    async (text: string) => {
      try {
        const { data, error } = await supabase
          .from('lecture_content')
          .upsert({
            lecture_id: lecture.id,
            content_type: 'notes',
            content: text,
            provider
          })
          .select()
          .single();

        if (error) throw error;

        onContentUpdate(data);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (err) {
        console.error('Error saving notes:', err);
        setSaveStatus(null);
      }
    },
    [lecture.id, onContentUpdate, provider, supabase]
  );

  // Auto-save with debounce
  useEffect(() => {
    const storedText = typeof content?.content === 'string' ? content.content : '';
    if (!isEditing || !editText || editText === storedText) {
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      await saveNotes(editText);
    }, 1500);

    return () => clearTimeout(timer);
  }, [content?.content, editText, isEditing, saveNotes]);

  const generateNotes = async () => {
    if (!lecture.transcript) {
      setError('No transcript available to generate notes from');
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
          mode: 'notes'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      const notesText = data.output;
      setEditText(notesText);

      // Save to database
      const { data: savedContent, error: dbError } = await supabase
        .from('lecture_content')
        .upsert({
          lecture_id: lecture.id,
          content_type: 'notes',
          content: notesText,
          provider
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onContentUpdate(savedContent);
    } catch (err) {
      console.error('Error generating notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate notes');
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
        <div style={{ fontSize: '4rem' }}>📝</div>
        <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
          No Notes Yet
        </h3>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '500px' }}>
          Generate comprehensive lecture notes from your transcript using AI. The notes will include key concepts,
          definitions, and action items.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          <div>
            <label
              htmlFor="provider"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}
            >
              Choose AI Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'openai' | 'anthropic')}
              style={{
                width: '100%',
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
          </div>

          <button
            onClick={generateNotes}
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
            Generate Notes
          </button>
        </div>

        {error && (
          <p style={{ color: 'var(--status-error)', fontSize: '0.9rem', maxWidth: '400px', textAlign: 'center' }}>
            {error}
          </p>
        )}
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Generating notes with {provider === 'openai' ? 'ChatGPT' : 'Claude'}...
        </p>
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
        {/* Header */}
        <div
          style={{
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Lecture Notes</h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Generated by {content?.provider === 'openai' ? 'ChatGPT' : 'Claude'}
              {saveStatus === 'saving' && ' • Saving...'}
              {saveStatus === 'saved' && ' • ✓ Saved'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-strong)',
                background: isEditing ? 'var(--accent-gradient)' : 'var(--surface-panel-faint)',
                color: isEditing ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {isEditing ? '✓ Done Editing' : '✏️ Edit'}
            </button>

            <button
              onClick={generateNotes}
              disabled={isGenerating}
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
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{
              width: '100%',
              minHeight: '500px',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-stronger)',
              background: 'var(--surface-input)',
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              resize: 'vertical'
            }}
            placeholder="Write your notes here (supports Markdown)..."
          />
        ) : (
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {typeof content?.content === 'string' ? content.content : ''}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
