'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { createClient } from '../../../lib/supabase/client';
import type { Lecture } from '../../../lib/supabase/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MyNotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-notes' | 'no-notes'>('all');
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchLectures();
    }
  }, [user]);

  const fetchLectures = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLectures(data || []);
    } catch (error) {
      console.error('Error fetching lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLectures = lectures.filter((lecture) => {
    // Search filter
    const matchesSearch =
      lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.transcript?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    let matchesType = true;
    if (filterType === 'with-notes') {
      matchesType = !!lecture.transcript;
    } else if (filterType === 'no-notes') {
      matchesType = !lecture.transcript;
    }

    return matchesSearch && matchesType;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        Loading your notes...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            padding: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          ← Back to Dashboard
        </button>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Notes</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          All your recordings, transcripts, and AI-generated class notes in one place
        </p>
      </div>

      {/* Search and Filters */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}
      >
        <input
          type="text"
          placeholder="Search lectures by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '0.875rem 1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-medium)',
            background: 'var(--surface-input)',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem'
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '0.75rem',
            background: 'var(--surface-panel-faint)',
            border: '1px solid var(--border-medium)'
          }}
        >
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: filterType === 'all' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
              background: filterType === 'all' ? 'var(--accent-gradient)' : 'transparent',
              transition: 'all 150ms ease'
            }}
          >
            All ({lectures.length})
          </button>
          <button
            onClick={() => setFilterType('with-notes')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color:
                filterType === 'with-notes' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
              background: filterType === 'with-notes' ? 'var(--accent-gradient)' : 'transparent',
              transition: 'all 150ms ease'
            }}
          >
            With Notes ({lectures.filter((l) => l.transcript).length})
          </button>
          <button
            onClick={() => setFilterType('no-notes')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color:
                filterType === 'no-notes' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
              background: filterType === 'no-notes' ? 'var(--accent-gradient)' : 'transparent',
              transition: 'all 150ms ease'
            }}
          >
            No Notes ({lectures.filter((l) => !l.transcript).length})
          </button>
        </div>
      </div>

      {/* Lectures List */}
      {filteredLectures.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'var(--surface-panel)',
            borderRadius: '1rem',
            border: '1px solid var(--border-medium)'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            {searchQuery
              ? 'No lectures found'
              : filterType === 'with-notes'
                ? 'No lectures with notes yet'
                : filterType === 'no-notes'
                  ? 'All lectures have notes'
                  : 'No lectures yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start by recording or uploading your first lecture'}
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/new?mode=record"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                background: 'var(--accent-gradient)',
                color: 'var(--accent-text-contrast)',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Create Your First Lecture
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredLectures.map((lecture) => (
            <Link
              key={lecture.id}
              href={`/lecture/${lecture.id}`}
              style={{
                padding: '1.5rem',
                borderRadius: '0.75rem',
                background: 'var(--surface-panel)',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-panel)',
                textDecoration: 'none',
                display: 'flex',
                gap: '1.5rem',
                transition: 'all 150ms ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'var(--border-medium)';
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '0.75rem',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  flexShrink: 0
                }}
              >
                {lecture.transcript ? '📝' : '🎤'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem',
                    gap: '1rem'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {lecture.title}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                      flexShrink: 0
                    }}
                  >
                    <span>{formatDuration(lecture.duration)}</span>
                    <span>•</span>
                    <span>{formatDate(lecture.created_at)}</span>
                  </div>
                </div>

                {lecture.transcript ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: 'var(--text-soft)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.5
                    }}
                  >
                    {lecture.transcript}
                  </p>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic'
                    }}
                  >
                    No transcript available yet
                  </p>
                )}

                {/* Tags/Status */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {lecture.transcript && (
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      Transcribed
                    </span>
                  )}
                  {lecture.audio_url && (
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      Audio Available
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
