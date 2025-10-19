'use client';

type ContentType = 'transcript' | 'notes' | 'flashcards' | 'mindmap' | 'summary' | 'chat' | 'settings';

interface LectureSidebarProps {
  activeTab: ContentType;
  onTabChange: (tab: ContentType) => void;
  hasTranscript: boolean;
  hasNotes: boolean;
  hasFlashcards: boolean;
  hasMindmap: boolean;
  hasSummary: boolean;
}

interface NavItem {
  id: ContentType;
  icon: string;
  label: string;
  hasContent?: boolean;
}

export function LectureSidebar({
  activeTab,
  onTabChange,
  hasTranscript,
  hasNotes,
  hasFlashcards,
  hasMindmap,
  hasSummary
}: LectureSidebarProps) {
  const navItems: NavItem[] = [
    { id: 'transcript', icon: '📄', label: 'Transcript', hasContent: hasTranscript },
    { id: 'notes', icon: '📝', label: 'Notes', hasContent: hasNotes },
    { id: 'summary', icon: '🗂️', label: 'Summary', hasContent: hasSummary },
    { id: 'flashcards', icon: '🃏', label: 'Flashcards', hasContent: hasFlashcards },
    { id: 'mindmap', icon: '🗺️', label: 'Mind Map', hasContent: hasMindmap },
    { id: 'chat', icon: '💬', label: 'Chat' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div
      style={{
        width: '240px',
        borderRight: '1px solid var(--border-medium)',
        background: 'var(--surface-panel)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0'
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeTab === item.id ? 'var(--accent-gradient)' : 'transparent',
              color: activeTab === item.id ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === item.id ? 600 : 500,
              textAlign: 'left',
              transition: 'all 150ms ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.background = 'var(--surface-panel-faint)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.hasContent !== undefined && item.hasContent && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: activeTab === item.id ? 'var(--accent-text-contrast)' : 'var(--accent-primary)'
                }}
                title="Content available"
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
