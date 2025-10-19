# Lecture Note Platform - Complete Redesign Plan

## Overview
Transform from a single-page demo into a full-featured SaaS application with user accounts, persistent storage, and an intuitive workflow.

## Core Design Principles
1. **Progressive disclosure** - Show users only what they need, when they need it
2. **Spatial consistency** - Each task has its own dedicated space
3. **Clear hierarchy** - Primary actions are obvious, secondary actions accessible
4. **Persistent state** - Nothing is lost, everything is saved automatically

## User Flow

### 1. Landing Page (`/`)
**Purpose:** Convert visitors to users

**Layout:**
- Hero section with clear value prop
- Single primary CTA: "Get Started Free" (if not logged in) or "Go to Dashboard" (if logged in)
- Feature showcase (simplified, 3 cards max)
- Social proof section

**Actions:**
- Sign up / Log in
- Learn more (optional)

---

### 2. Authentication
**Provider:** Supabase Auth

**Features:**
- Email/password
- Google OAuth (optional)
- Magic link email (optional)

**UX:**
- Modal overlay (not separate page)
- Tab switching: Sign In / Sign Up
- Clear error messages
- Auto-redirect to dashboard on success

---

### 3. Dashboard (`/dashboard`)
**Purpose:** Central hub for all lectures

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Welcome back, [Name]!            [Profile] [Logout] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐     │
│  │  🎤 New Recording    📁 Upload File       │     │
│  │                                            │     │
│  │  [Large, obvious buttons]                  │     │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  Recent Lectures                      [Search ____] │
│  ┌──────────┬──────────┬──────────┬──────────┐     │
│  │ Lecture  │ Lecture  │ Lecture  │ Lecture  │     │
│  │ Card 1   │ Card 2   │ Card 3   │ Card 4   │     │
│  │          │          │          │          │     │
│  │ 45 min   │ 1h 20m   │ 30 min   │ 2h       │     │
│  │ 3d ago   │ 1w ago   │ 2w ago   │ 3w ago   │     │
│  └──────────┴──────────┴──────────┴──────────┘     │
│                                                      │
│  [Show more lectures...]                            │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Grid of lecture cards (title, duration, date, thumbnail/icon)
- Search and filter
- Quick actions: New Recording, Upload File
- Lecture card actions: Open, Rename, Delete

---

### 4. Recording/Upload Modal
**Trigger:** Click "New Recording" or "Upload File"

**Layout:** Full-screen modal with focused interface

**Recording Tab:**
```
┌─────────────────────────────────────────────┐
│                    ✕ Close                  │
├─────────────────────────────────────────────┤
│                                             │
│  Title: [Untitled Lecture ______________]   │
│                                             │
│  ╔═══════════════════════════════════════╗ │
│  ║                                       ║ │
│  ║      WAVEFORM VISUALIZATION           ║ │
│  ║      (Large, centered, beautiful)     ║ │
│  ║                                       ║ │
│  ╚═══════════════════════════════════════╝ │
│                                             │
│        ● REC 02:34                          │
│                                             │
│   [⏸ Pause]              [⏹ Stop & Save]   │
│                                             │
│   or [Start Recording]                      │
│                                             │
└─────────────────────────────────────────────┘
```

**Upload Tab:**
```
┌─────────────────────────────────────────────┐
│                    ✕ Close                  │
├─────────────────────────────────────────────┤
│                                             │
│  Title: [Untitled Lecture ______________]   │
│                                             │
│  ╔═══════════════════════════════════════╗ │
│  ║                                       ║ │
│  ║     📁  Drop file here                ║ │
│  ║                                       ║ │
│  ║     or click to browse                ║ │
│  ║                                       ║ │
│  ║     MP3, WAV, M4A, WEBM               ║ │
│  ║                                       ║ │
│  ╚═══════════════════════════════════════╝ │
│                                             │
│  Selected: lecture_01.mp3 (45.2 MB)        │
│                                             │
│           [Upload & Transcribe]             │
│                                             │
└─────────────────────────────────────────────┘
```

**Flow:**
1. User records/uploads audio
2. Enters title
3. Clicks "Save" or "Upload & Transcribe"
4. Modal shows progress: "Uploading audio... Transcribing... Done!"
5. Auto-redirects to Lecture View (`/lecture/[id]`)

---

### 5. Lecture View (`/lecture/[id]`)
**Purpose:** View and interact with a single lecture's content

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard              Biology 101 - Cell Division    │
├─────────────┬────────────────────────────────────────────────────┤
│             │                                                    │
│  SIDEBAR    │  MAIN CONTENT AREA                                │
│             │                                                    │
│  📄 Trans-  │  ┌──────────────────────────────────────────────┐ │
│     cript   │  │                                              │ │
│             │  │  [Tab content based on selection]            │ │
│  📝 Notes   │  │                                              │ │
│             │  │  - Transcript: Full text, timestamps         │ │
│  🗂️ Summary │  │  - Notes: Formatted markdown                 │ │
│             │  │  - Summary: Key points                       │ │
│  🃏 Flash-  │  │  - Flashcards: Flip card UI                  │ │
│     cards   │  │  - Mindmap: Hierarchical view                │ │
│             │  │  - Chat: Conversation interface              │ │
│  🗺️ Mindmap │  │                                              │ │
│             │  └──────────────────────────────────────────────┘ │
│  💬 Chat    │                                                    │
│             │  [Generate button if content doesn't exist]       │
│  ⚙️ Settings│                                                    │
│             │                                                    │
└─────────────┴────────────────────────────────────────────────────┘
```

**Sidebar Navigation:**
- Tab-like navigation
- Icons + labels
- Badge if content exists
- Generate button appears in main area when tab has no content

**Main Content Area:**
- Focused on one thing at a time
- Auto-saves as user edits
- "Generate with [OpenAI/Claude]" button if empty
- Loading states during generation
- Export options (PDF, markdown, etc.)

**Settings Tab:**
- LLM provider selection (OpenAI vs Claude)
- Regenerate options
- Delete lecture
- Download audio

---

## Technical Implementation Plan

### Phase 1: Supabase Setup
1. Create Supabase project
2. Set up authentication
3. Create database tables (lectures, lecture_content, lecture_chats)
4. Set up storage bucket for audio files
5. Configure Row Level Security (RLS) policies

### Phase 2: Authentication
1. Install Supabase client library
2. Create auth context/provider
3. Build sign in/sign up modal
4. Implement protected routes
5. Add logout functionality

### Phase 3: Dashboard
1. Create dashboard layout
2. Fetch and display user's lectures
3. Implement search/filter
4. Add lecture card component
5. Implement delete/rename actions

### Phase 4: Recording/Upload Flow
1. Create modal component
2. Integrate existing AudioRecorder
3. Build upload interface
4. Implement file upload to Supabase Storage
5. Connect to transcription API
6. Save lecture to database
7. Handle loading/error states

### Phase 5: Lecture View
1. Create sidebar navigation
2. Build transcript viewer
3. Implement auto-save for edits
4. Add "generate" buttons for each content type
5. Build flashcard flip UI
6. Implement chat interface
7. Add export functionality

### Phase 6: Polish
1. Loading skeletons
2. Error boundaries
3. Toast notifications
4. Keyboard shortcuts
5. Mobile responsive
6. Dark/light theme consistency

---

## Database Schema Details

```sql
-- Lectures
CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT, -- Supabase Storage path
  transcript TEXT,
  duration INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}'::jsonb, -- Store Deepgram metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content (notes, flashcards, etc.)
CREATE TABLE lecture_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'notes', 'flashcards', 'mindmap', 'summary'
  content JSONB NOT NULL,
  provider TEXT, -- 'openai' or 'anthropic'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lecture_id, content_type)
);

-- Chat messages
CREATE TABLE lecture_chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  provider TEXT, -- 'openai' or 'anthropic'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lectures_user_id ON lectures(user_id);
CREATE INDEX idx_lectures_created_at ON lectures(created_at DESC);
CREATE INDEX idx_lecture_content_lecture_id ON lecture_content(lecture_id);
CREATE INDEX idx_lecture_chats_lecture_id ON lecture_chats(lecture_id);

-- RLS Policies
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_chats ENABLE ROW LEVEL SECURITY;

-- Users can only see their own lectures
CREATE POLICY "Users can view own lectures"
  ON lectures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lectures"
  ON lectures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lectures"
  ON lectures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lectures"
  ON lectures FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for lecture_content and lecture_chats
-- (shortened for brevity)
```

---

## Component Structure

```
components/
├── auth/
│   ├── AuthModal.tsx          # Sign in/up modal
│   ├── AuthProvider.tsx       # Context provider
│   └── ProtectedRoute.tsx     # HOC for protected pages
├── dashboard/
│   ├── DashboardLayout.tsx    # Main dashboard wrapper
│   ├── LectureCard.tsx        # Individual lecture card
│   ├── LectureGrid.tsx        # Grid of lectures
│   ├── QuickActions.tsx       # New recording/upload buttons
│   └── SearchBar.tsx          # Search and filter
├── lecture/
│   ├── LectureLayout.tsx      # Sidebar + content area
│   ├── LectureSidebar.tsx     # Navigation sidebar
│   ├── TranscriptView.tsx     # Transcript display
│   ├── NotesView.tsx          # Notes editor
│   ├── FlashcardsView.tsx     # Flashcard UI
│   ├── MindmapView.tsx        # Mindmap display
│   ├── ChatView.tsx           # Chat interface
│   └── SettingsView.tsx       # Lecture settings
├── recording/
│   ├── RecordingModal.tsx     # Full modal container
│   ├── RecordingTab.tsx       # Recording interface
│   ├── UploadTab.tsx          # Upload interface
│   └── AudioRecorder.tsx      # Existing waveform recorder
├── ui/
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Tabs.tsx
│   └── Toast.tsx
└── layout/
    ├── Header.tsx             # Global header
    ├── Footer.tsx             # Global footer
    └── PageLayout.tsx         # Page wrapper
```

---

## Next Steps

**Option 1: Full Redesign (Recommended)**
- Implement everything above
- Complete transformation to SaaS app
- ~2-3 days of work

**Option 2: Incremental Approach**
- Start with Supabase setup + auth
- Add dashboard
- Migrate existing transcribe page to new flow
- ~1 week with testing

**What would you like me to do?**
1. Start implementing the full redesign now?
2. Set up Supabase first and show you the auth flow?
3. Create mockups/wireframes before coding?
4. Adjust the plan based on your feedback?
