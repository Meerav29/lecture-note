# Project Roadmap: Lecture Note Assistant

## Vision
Create an open-source, bring-your-own-key web app that records or uploads lecture audio, transcribes it with the user's preferred model provider, and generates detailed lecture notes and spaced-repetition flashcards. Provide a Vercel-hosted demo that uses a shared key with strict usage limits.

## Architecture Overview
- **Client (Next.js / React):**
  - Audio capture/upload component that handles local recordings and file drops.
  - Provider picker + API key form that stores keys securely in the browser (e.g., localStorage).
  - Views for live transcript, AI-generated notes, and flashcard deck management.
  - State management via React context or lightweight store to keep the UI in sync across pages.
- **Serverless API Routes (Next.js / Edge Functions):**
  - Thin proxy layer that accepts transcription/LLM requests and forwards them to the selected provider using the user's key.
  - Rate limiting + input validation before forwarding to providers.
  - Webhook/polling endpoints to stream transcription progress to the client.
- **Storage Layer:**
  - Optional durable storage (e.g., Supabase/Postgres/S3) for authenticated users.
  - For BYOK mode, default to browser storage; provide adapters in `lib/storage.ts` to swap in external backends.
- **AI Services:**
  - Pluggable provider interface in `lib/types.ts` describing capabilities (speech-to-text, text generation, embeddings).
  - Default adapters for OpenAI Whisper / GPT-4o mini, with extension points for other APIs (Anthropic, Deepgram, etc.).

## Suggested Development Phases
1. **Infrastructure Setup**
   - [ ] Define environment variables and `.env.example` for local + Vercel deployments.
   - [ ] Implement shared UI shell in `app/layout.tsx` with navigation between Transcribe, Notes, and Flashcards pages.
   - [ ] Add Tailwind/Chakra or chosen UI framework for rapid layout.

2. **Transcription MVP**
   - [ ] Fill out `components/AudioRecorder.tsx` and `components/FileDrop.tsx` for recording/uploading audio.
   - [ ] Implement `app/transcribe/page.tsx` page with recorder, file upload, and provider selection.
   - [ ] Create `lib/providers/*` modules for at least one STT provider; wire to serverless route.
   - [ ] Render live or batched transcripts with `components/TranscriptViewer.tsx`.

3. **Notes Generation**
   - [ ] Define prompt templates and parsing helpers in `lib/notes.ts`.
   - [ ] Build `components/NotesViewer.tsx` to display structured notes (sections, bullet points, action items).
   - [ ] Add a "Generate Notes" workflow that takes transcript text and hits the selected LLM via proxy route.

4. **Flashcards Module**
   - [ ] Use `lib/flashcard.ts` to define card schema and spaced repetition metadata.
   - [ ] Implement `components/FlashcardDeck.tsx` with card browsing, rating buttons, and scheduling logic.
   - [ ] Enable exporting decks (CSV, Anki) and storing them client-side.

5. **User Experience Enhancements**
   - [ ] Add timeline sync between transcript and audio playback.
   - [ ] Offer highlighting + note annotation, cross-link to flashcards.
   - [ ] Include onboarding flow explaining BYOK setup.

6. **Deployment & Demo**
   - [ ] Configure Vercel project with required build settings and edge functions.
   - [ ] Implement feature flag that disables persistent storage and enforces per-session quotas on the demo.
   - [ ] Document how contributors can run the project locally and add new providers.

## Contribution Guidelines & Next Steps
- Convert the checklist above into GitHub issues/milestones.
- Add CI (e.g., GitHub Actions) for linting, type-checking, and basic e2e tests once components exist.
- Maintain provider stubs with mocked responses so contributors can test without incurring costs.
- Encourage students to share prompts, note templates, and flashcard strategies via community discussions.

Use this roadmap as the initial milestone plan. Adjust as requirements become clearer or as new contributors join.
