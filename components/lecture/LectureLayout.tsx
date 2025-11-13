'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lecture, LectureContent } from '../../lib/supabase/types';
import { LectureSidebar } from './LectureSidebar';
import { TranscriptView } from './TranscriptView';
import { NotesView } from './NotesView';
import { FlashcardsView } from './FlashcardsView';
import { MindmapView } from './MindmapView';
import { ChatView } from './ChatView';
import { SummaryView } from './SummaryView';
import { SettingsView } from './SettingsView';

type ContentType = 'transcript' | 'notes' | 'flashcards' | 'mindmap' | 'summary' | 'chat' | 'settings';

interface LectureLayoutProps {
  lecture: Lecture;
  contents: Record<string, LectureContent>;
  onContentUpdate: (contentType: string, content: LectureContent) => void;
  onLectureUpdate: (lecture: Lecture) => void;
}

export function LectureLayout({
  lecture,
  contents,
  onContentUpdate,
  onLectureUpdate
}: LectureLayoutProps) {
  const [activeTab, setActiveTab] = useState<ContentType>('transcript');
  const router = useRouter();
  const statusLabelMap: Record<Lecture['transcription_status'], string> = {
    pending: 'Queued',
    processing: 'Processing',
    completed: 'Ready',
    failed: 'Failed'
  };
  const statusColorMap: Record<Lecture['transcription_status'], string> = {
    pending: 'var(--text-muted)',
    processing: 'var(--accent-primary)',
    completed: 'var(--status-success)',
    failed: 'var(--status-error)'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'transcript':
        return <TranscriptView lecture={lecture} />;
      case 'notes':
        return (
          <NotesView
            lecture={lecture}
            content={contents.notes}
            onContentUpdate={(content) => onContentUpdate('notes', content)}
          />
        );
      case 'flashcards':
        return (
          <FlashcardsView
            lecture={lecture}
            content={contents.flashcards}
            onContentUpdate={(content) => onContentUpdate('flashcards', content)}
          />
        );
      case 'mindmap':
        return (
          <MindmapView
            lecture={lecture}
            content={contents.mindmap}
            onContentUpdate={(content) => onContentUpdate('mindmap', content)}
          />
        );
      case 'summary':
        return (
          <SummaryView
            lecture={lecture}
            content={contents.summary}
            onContentUpdate={(content) => onContentUpdate('summary', content)}
          />
        );
      case 'chat':
        return <ChatView lecture={lecture} />;
      case 'settings':
        return <SettingsView lecture={lecture} onLectureUpdate={onLectureUpdate} />;
      default:
        return <TranscriptView lecture={lecture} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border-medium)',
          background: 'var(--surface-panel)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.25rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Back to Dashboard"
          >
            ←
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <h1
                style={{
                  fontSize: '1.5rem',
                  margin: 0,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {lecture.title}
              </h1>
              <span
                style={{
                  padding: '0.15rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--border-medium)',
                  color: statusColorMap[lecture.transcription_status],
                  background: 'var(--surface-panel-faint)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}
              >
                {statusLabelMap[lecture.transcription_status]}
              </span>
            </div>
            {lecture.duration && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')} •{' '}
                {new Date(lecture.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <LectureSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasTranscript={!!lecture.transcript}
          hasNotes={!!contents.notes}
          hasFlashcards={!!contents.flashcards}
          hasMindmap={!!contents.mindmap}
          hasSummary={!!contents.summary}
        />

        {/* Content Area */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: 'var(--surface-panel-contrast)'
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
