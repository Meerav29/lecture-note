'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lecture } from '../../lib/supabase/types';
import { createClient } from '../../lib/supabase/client';

interface SettingsViewProps {
  lecture: Lecture;
  onLectureUpdate: (lecture: Lecture) => void;
}

export function SettingsView({ lecture, onLectureUpdate }: SettingsViewProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(lecture.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleSaveTitle = async () => {
    if (title.trim() === lecture.title) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('lectures')
        .update({ title: title.trim() })
        .eq('id', lecture.id)
        .select()
        .single();

      if (error) throw error;
      onLectureUpdate(data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating title:', err);
      alert('Failed to update title');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete from database (cascade will handle related content and chats)
      const { error } = await supabase.from('lectures').delete().eq('id', lecture.id);

      if (error) throw error;

      // Delete audio file from storage if it exists
      if (lecture.audio_url) {
        await supabase.storage.from('lecture-audio').remove([lecture.audio_url]);
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting lecture:', err);
      alert('Failed to delete lecture');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div
        style={{
          background: 'var(--surface-panel)',
          borderRadius: '1rem',
          padding: '2rem',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-panel)',
          display: 'grid',
          gap: '2rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>Lecture Settings</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Manage your lecture details and settings
          </p>
        </div>

        {/* Title */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              fontSize: '0.95rem'
            }}
          >
            Lecture Title
          </label>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-stronger)',
                  background: 'var(--surface-input)',
                  color: 'var(--text-secondary)',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={handleSaveTitle}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: 'var(--accent-gradient)',
                  color: 'var(--accent-text-contrast)',
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setTitle(lecture.title);
                  setIsEditing(false);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-strong)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                {lecture.title}
              </span>
              <button
                onClick={() => setIsEditing(true)}
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
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
            Lecture Information
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {formatDuration(lecture.duration)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Created:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {formatDate(lecture.created_at)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Updated:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {formatDate(lecture.updated_at)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Has Transcript:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                {lecture.transcript ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--status-error)',
            background: 'rgba(252, 165, 165, 0.05)'
          }}
        >
          <h3
            style={{
              fontSize: '1.1rem',
              margin: '0 0 0.5rem 0',
              color: 'var(--status-error)',
              fontWeight: 600
            }}
          >
            Danger Zone
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Deleting this lecture will permanently remove it along with all generated content (notes, flashcards,
            chat history, etc.). This action cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'var(--status-error)',
              color: '#fff',
              fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem'
            }}
          >
            {isDeleting ? 'Deleting...' : '🗑️ Delete Lecture'}
          </button>
        </div>
      </div>
    </div>
  );
}
