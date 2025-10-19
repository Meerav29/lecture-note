'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase/client';
import type { Lecture } from '../../lib/supabase/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
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

  const deleteLecture = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    try {
      const { error } = await supabase.from('lectures').delete().eq('id', id);
      if (error) throw error;
      setLectures(lectures.filter((l) => l.id !== id));
    } catch (error) {
      console.error('Error deleting lecture:', error);
      alert('Failed to delete lecture');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
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
        Loading your lectures...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {lectures.length === 0
            ? 'No lectures yet. Get started by recording or uploading your first lecture.'
            : `You have ${lectures.length} lecture${lectures.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '3rem'
        }}
      >
        <Link
          href="/dashboard/new?mode=record"
          style={{
            padding: '2rem',
            borderRadius: '1rem',
            background: 'var(--accent-gradient)',
            color: 'var(--accent-text-contrast)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-panel)',
            transition: 'transform 150ms ease, box-shadow 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 40px 90px rgba(14, 116, 236, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-panel)';
          }}
        >
          <div style={{ fontSize: '2rem' }}>🎤</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>New Recording</h3>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Record audio directly from your microphone with live waveform
          </p>
        </Link>

        <Link
          href="/dashboard/new?mode=upload"
          style={{
            padding: '2rem',
            borderRadius: '1rem',
            background: 'var(--surface-panel)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-panel)',
            transition: 'transform 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: '2rem' }}>📁</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Upload File</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Upload pre-recorded lectures in MP3, WAV, or M4A format
          </p>
        </Link>
      </div>

      {/* Lectures Grid */}
      {lectures.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Lectures</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {lectures.map((lecture) => (
              <div
                key={lecture.id}
                style={{
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  background: 'var(--surface-panel)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-panel)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div>
                  <h4
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      margin: '0 0 0.5rem 0',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {lecture.title}
                  </h4>
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>{formatDuration(lecture.duration)}</span>
                    <span>•</span>
                    <span>{formatDate(lecture.created_at)}</span>
                  </div>
                </div>

                {lecture.transcript && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: 'var(--text-soft)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {lecture.transcript}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                  <Link
                    href={`/lecture/${lecture.id}`}
                    style={{
                      flex: 1,
                      padding: '0.625rem 1rem',
                      borderRadius: '0.5rem',
                      background: 'var(--accent-gradient)',
                      color: 'var(--accent-text-contrast)',
                      textDecoration: 'none',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => deleteLecture(lecture.id)}
                    style={{
                      padding: '0.625rem 1rem',
                      borderRadius: '0.5rem',
                      background: 'transparent',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--status-error)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
