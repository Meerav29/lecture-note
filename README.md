# Lecture Note Assistant

An open-source, bring-your-own-key web application that turns lecture audio into transcripts, structured notes, and spaced-repetition flashcards. Upload existing recordings or capture audio in the browser, then pick the AI provider that best fits your workflow.

## Features
- **Transcription workflow:** Upload files or record in-browser, then transcribe with Deepgram (default) or other pluggable providers.
- **Lecture notes:** Summarize transcripts into organized sections, bullet points, and action items.
- **Flashcards:** Generate study decks automatically and review them with simple spaced-repetition controls.
- **Transcript-grounded chat:** Ask follow-up questions about a transcript and get answers sourced only from the lecture content.
- **Bring your own key:** Keep API keys client-side; provider support lives in `lib/providers` for easy extension.
- **Demo-ready:** Built with Next.js for fast Vercel deployment and feature-flagged demos.

## Getting Started
1. Install dependencies:
   
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and add your provider keys (at minimum `DEEPGRAM_API_KEY`).
3. Run the development server:
   
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000/transcribe` to upload audio, review the transcript, generate study materials, and chat with your lecture notes.
5. Explore `http://localhost:3000/notes` and `http://localhost:3000/cards` as the notes and flashcard modules take shape.

## Environment Variables
| Name | Description |
| --- | --- |
| `DEEPGRAM_API_KEY` | API key used for Deepgram transcription requests. |
| `OPENAI_API_KEY` | API key used for ChatGPT-powered study materials and chat replies. |
| `CLAUDE_API_KEY` / `ANTHROPIC_API_KEY` | API key used for Claude-powered study materials and chat replies. |

## Deepgram Integration
- Provide a `DEEPGRAM_API_KEY` in `.env.local` or the deployment environment.
- `lib/providers/deepgram.ts` wraps the Deepgram SDK and can be customized with models, summarization, and formatting settings.
- `app/api/transcribe/route.ts` accepts uploaded audio, forwards it to the Deepgram provider, and returns the transcript plus metadata for the UI.

## Background Transcription
Long recordings are now queued and processed by a Supabase Edge Function so Vercel requests never time out. Follow [`docs/BACKGROUND_TRANSCRIPTION.md`](docs/BACKGROUND_TRANSCRIPTION.md) to run the database migration, deploy the worker, and schedule it on your project.

## Roadmap & Contributions
- Track upcoming work and architecture decisions in [`docs/roadmap.md`](docs/roadmap.md).
- Open issues or pull requests for new providers, UI polish, or documentation improvements.
- Follow standard GitHub flow: fork, branch, make changes, run tests/lint, then open a PR.

## License
Licensed under the MIT License. See [`LICENSE`](LICENSE) for details.
