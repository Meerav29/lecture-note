'use client';

import { ComponentProps, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AudioRecorder } from '../../components/AudioRecorder';

type GenerationMode = 'notes' | 'flashcards' | 'mindmap';

type InputMode = 'upload' | 'record';

type ProviderOption = 'openai' | 'anthropic';

interface TranscriptResponse {
  transcript: string;
  metadata: {
    duration?: number;
    model?: string;
    confidence?: number;
  };
}

interface GenerationResult {
  mode: GenerationMode;
  output: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
const GENERATION_LABELS: Record<GenerationMode, string> = {
  notes: 'Generate class notes',
  flashcards: 'Generate flashcards',
  mindmap: 'Generate mind map'
};

const GENERATION_DESCRIPTIONS: Record<GenerationMode, string> = {
  notes: 'Create structured lecture notes with detailed explanations for each topic.',
  flashcards: 'Produce question and answer flashcards that cover the lecture highlights.',
  mindmap: 'Outline the lecture as a hierarchical mind map with nested bullet points.'
};

const PROVIDER_LABELS: Record<ProviderOption, string> = {
  openai: 'ChatGPT (OpenAI)',
  anthropic: 'Claude (Anthropic)'
};

const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1
      style={{
        fontSize: '1.45rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: '0.9rem 0 0.5rem'
      }}
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        margin: '0.75rem 0 0.45rem'
      }}
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      style={{
        fontSize: '1.1rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        margin: '0.6rem 0 0.35rem'
      }}
      {...props}
    />
  ),
  p: ({ node, ...props }) => (
    <p style={{ margin: '0.45rem 0', color: 'var(--text-soft-strong)', lineHeight: 1.55 }} {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul
      style={{
        margin: '0.5rem 0 0.5rem 1.1rem',
        padding: 0,
        color: 'var(--text-soft-strong)',
        lineHeight: 1.55,
        listStyleType: 'disc'
      }}
      {...props}
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      style={{
        margin: '0.5rem 0 0.5rem 1.1rem',
        padding: 0,
        color: 'var(--text-soft-strong)',
        lineHeight: 1.55,
        listStyleType: 'decimal'
      }}
      {...props}
    />
  ),
  li: ({ node, ...props }) => <li style={{ marginBottom: '0.3rem' }} {...props} />,
  strong: ({ node, ...props }) => <strong style={{ color: 'var(--text-primary)' }} {...props} />,
  em: ({ node, ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
  hr: () => (
    <hr
      style={{
        margin: '1rem 0',
        border: 0,
        borderTop: '1px solid var(--border-strong)'
      }}
    />
  ),
  code: ({ node, ...rest }) => {
    const { inline: isInline = false, ...codeProps } = rest as { inline?: boolean } & ComponentProps<'code'>;
    return (
      <code
        {...codeProps}
        style={{
          background: 'var(--surface-code)',
          borderRadius: '0.35rem',
          padding: isInline ? '0.1rem 0.35rem' : '0.6rem',
          display: isInline ? 'inline' : 'block',
          color: 'var(--text-code)',
          fontSize: isInline ? '0.95em' : '0.9rem',
          marginTop: isInline ? 0 : '0.4rem'
        }}
      />
    );
  }
};

const MarkdownOutput = ({ content }: { content: string }) => (
  <div style={{ color: 'var(--text-soft-strong)', fontSize: '1rem', lineHeight: 1.55 }}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  </div>
);

export default function TranscribePage() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptResponse | null>(null);

  const [provider, setProvider] = useState<ProviderOption>('openai');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<GenerationMode | null>(null);
  const [generations, setGenerations] = useState<GenerationResult[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fileLabel = useMemo(() => {
    if (inputMode === 'record' && recordedAudio) {
      const sizeMb = (recordedAudio.size / (1024 * 1024)).toFixed(2);
      return `Recorded audio (${sizeMb} MB)`;
    }
    if (!file) return 'Choose an audio file';
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.name} (${sizeMb} MB)`;
  }, [file, recordedAudio, inputMode]);

  const metadataSummary = useMemo(() => {
    if (!result) return '';

    return [
      result.metadata.model && `Model: ${result.metadata.model}`,
      result.metadata.duration && `Duration: ${result.metadata.duration.toFixed(2)}s`,
      typeof result.metadata.confidence === 'number' &&
        `Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`
    ]
      .filter((value): value is string => Boolean(value))
      .join(' â€¢ ');
  }, [result]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const audioSource = inputMode === 'record' ? recordedAudio : file;
    if (!audioSource) {
      setError(
        inputMode === 'record'
          ? 'Please record audio before transcribing.'
          : 'Please select an audio file before uploading.'
      );
      return;
    }

    setError(null);
    setGenerationError(null);
    setGenerations([]);
    setResult(null);
    setChatMessages([]);
    setChatError(null);
    setChatInput('');
    setIsChatting(false);
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Convert Blob to File if it's recorded audio
      const audioFile =
        audioSource instanceof File
          ? audioSource
          : new File([audioSource], 'recording.webm', { type: 'audio/webm' });

      formData.append('file', audioFile);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Transcription failed.');
      }

      const payload = (await response.json()) as TranscriptResponse;
      setResult(payload);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Unable to transcribe audio.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordingComplete = (audioBlob: Blob) => {
    setRecordedAudio(audioBlob);
    setError(null);
  };

  const handleGenerate = async (mode: GenerationMode) => {
    if (!result?.transcript) {
      setGenerationError('Transcribe audio before generating study materials.');
      return;
    }

    setGenerationError(null);
    setIsGenerating(mode);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          transcript: result.transcript,
          mode
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Generation failed.');
      }

      const output = typeof payload.output === 'string' ? payload.output.trim() : '';
      if (!output) {
        throw new Error('The language model returned an empty response.');
      }

      setGenerations((previous) => {
        const withoutMode = previous.filter((entry) => entry.mode !== mode);
        return [...withoutMode, { mode, output }];
      });
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : 'Unable to generate the requested content.';
      setGenerationError(message);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!result?.transcript) {
      setChatError('Transcribe audio before asking questions.');
      return;
    }

    const question = chatInput.trim();
    if (!question) {
      setChatError('Type a question before sending.');
      return;
    }

    const previousMessages = [...chatMessages];
    const userEntry: ChatMessage = { role: 'user', content: question };
    const requestMessages = [...previousMessages, userEntry];

    setChatError(null);
    setChatMessages(requestMessages);
    setChatInput('');
    setIsChatting(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          transcript: result.transcript,
          messages: requestMessages
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Chat request failed.');
      }

      const answer =
        typeof payload.message?.content === 'string' ? payload.message.content.trim() : '';

      if (!answer) {
        throw new Error('The assistant returned an empty response.');
      }

      setChatMessages((current) => [...current, { role: 'assistant', content: answer }]);
    } catch (chatRequestError) {
      const message =
        chatRequestError instanceof Error
          ? chatRequestError.message
          : 'Unable to get a response from the assistant.';
      setChatError(message);
      setChatMessages(previousMessages);
      setChatInput(question);
    } finally {
      setIsChatting(false);
    }
  };
  const getGeneration = (mode: GenerationMode) =>
    generations.find((entry) => entry.mode === mode)?.output ?? '';

  return (
    <section style={{ display: 'grid', gap: '1.5rem', marginBottom: '4rem' }}>
      <article
        style={{
          padding: '2rem',
          borderRadius: '1rem',
          background: 'var(--surface-panel)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-panel)'
        }}
      >
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Transcribe audio with Deepgram</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-soft-strong)' }}>
          Upload a pre-recorded lecture or record audio directly from your microphone. Deepgram will
          transcribe the audio and return the transcript.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {/* Input Mode Toggle */}
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
              type="button"
              onClick={() => {
                setInputMode('upload');
                setRecordedAudio(null);
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                color: inputMode === 'upload' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
                background: inputMode === 'upload' ? 'var(--accent-gradient)' : 'transparent',
                transition: 'all 150ms ease'
              }}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('record');
                setFile(null);
                setError(null);
              }}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                color: inputMode === 'record' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
                background: inputMode === 'record' ? 'var(--accent-gradient)' : 'transparent',
                transition: 'all 150ms ease'
              }}
            >
              Record Audio
            </button>
          </div>

          {/* File Upload Section */}
          {inputMode === 'upload' && (
            <label
              htmlFor="audio"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '2px dashed var(--border-bold)',
                background: 'var(--surface-input)',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontWeight: 600 }}>Audio file</span>
              <span style={{ color: 'var(--text-muted)' }}>{fileLabel}</span>
              <input
                id="audio"
                name="file"
                type="file"
                accept="audio/*"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null;
                  setFile(selectedFile);
                  setResult(null);
                  setError(null);
                  setGenerations([]);
                  setGenerationError(null);
                  setChatMessages([]);
                  setChatError(null);
                  setChatInput('');
                  setIsChatting(false);
                }}
                style={{ display: 'none' }}
              />
            </label>
          )}

          {/* Recording Section */}
          {inputMode === 'record' && (
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              onRecordingStart={() => {
                setResult(null);
                setError(null);
                setGenerations([]);
                setGenerationError(null);
                setChatMessages([]);
                setChatError(null);
                setChatInput('');
                setIsChatting(false);
              }}
            />
          )}

          <div
            style={{
              display: 'grid',
              gap: '0.75rem',
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-medium)',
              background: 'var(--surface-panel-faint)'
            }}
          >
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label htmlFor="provider" style={{ fontWeight: 600 }}>
                Choose language model
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(event) => {
                  const nextProvider = event.target.value as ProviderOption;
                  setProvider(nextProvider);
                  setChatMessages([]);
                  setChatError(null);
                  setChatInput('');
                  setIsChatting(false);
                }}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-stronger)',
                  background: 'var(--surface-input)',
                  color: 'var(--text-secondary)'
                }}
              >
                {(Object.keys(PROVIDER_LABELS) as ProviderOption[]).map((option) => (
                  <option key={option} value={option}>
                    {PROVIDER_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Requests use the server-configured API key for your selected provider. Update
              `.env.local` to change the key used in this demo.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (inputMode === 'record' && !recordedAudio)}
            style={{
              padding: '0.85rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 600,
              cursor:
                isSubmitting || (inputMode === 'record' && !recordedAudio)
                  ? 'not-allowed'
                  : 'pointer',
              color: 'var(--accent-text-contrast)',
              background:
                isSubmitting || (inputMode === 'record' && !recordedAudio)
                  ? 'var(--accent-gradient-muted)'
                  : 'var(--accent-gradient-alt)',
              transition: 'filter 150ms ease'
            }}
          >
            {isSubmitting
              ? 'Transcribing…'
              : inputMode === 'record'
                ? 'Transcribe Recording'
                : 'Upload and Transcribe'}
          </button>
        </form>

        {error && (
          <p role="alert" style={{ color: 'var(--status-error)', marginTop: '1rem' }}>
            {error}
          </p>
        )}
      </article>

      {result && (
        <article
          style={{
            padding: '2rem',
            borderRadius: '1rem',
            background: 'var(--surface-panel-contrast)',
            border: '1px solid var(--border-default)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            display: 'grid',
            gap: '1.5rem'
          }}
        >
          <section>
            <header style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.35rem' }}>Transcript</h3>
              {metadataSummary && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{metadataSummary}</p>
              )}
            </header>
            <div style={{ color: 'var(--text-secondary)' }}>{result.transcript || 'No transcript returned.'}</div>
          </section>

          <section
            style={{
              padding: '1.5rem',
              borderRadius: '0.75rem',
              background: 'var(--surface-panel-muted)',
              border: '1px solid var(--border-default)',
              display: 'grid',
              gap: '1rem'
            }}
          >
            <header>
              <h3 style={{ marginBottom: '0.35rem' }}>Create study materials</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Send the transcript to {PROVIDER_LABELS[provider]} with a tailored prompt to create
                notes, flashcards, or a mind map.
              </p>
            </header>

            <div
              style={{
                display: 'grid',
                gap: '0.75rem'
              }}
            >
              {(Object.keys(GENERATION_LABELS) as GenerationMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleGenerate(mode)}
                  disabled={isGenerating === mode}
                  style={{
                    padding: '0.75rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-strong)',
                    background:
                      isGenerating === mode
                        ? 'var(--accent-gradient-muted)'
                        : 'var(--accent-gradient)',
                    color: 'var(--accent-text-contrast)',
                    fontWeight: 600,
                    cursor: isGenerating === mode ? 'wait' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.35rem',
                    textAlign: 'left'
                  }}
                >
                  <span>{isGenerating === mode ? 'Generatingâ€¦' : GENERATION_LABELS[mode]}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--accent-text-contrast)' }}>
                    {GENERATION_DESCRIPTIONS[mode]}
                  </span>
                </button>
              ))}
            </div>

            {generationError && (
              <p role="alert" style={{ color: 'var(--status-error)' }}>
                {generationError}
              </p>
            )}
          </section>

          <section
            style={{
              padding: '1.5rem',
              borderRadius: '0.75rem',
              background: 'var(--surface-panel-muted)',
              border: '1px solid var(--border-default)',
              display: 'grid',
              gap: '1rem'
            }}
          >
            <header>
              <h3 style={{ marginBottom: '0.35rem' }}>Chat with your notes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Ask {PROVIDER_LABELS[provider]} about the transcript. Responses stay grounded in this
                lecture.
              </p>
            </header>

            <div
              style={{
                maxHeight: '18rem',
                overflowY: 'auto',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-panel-soft)',
                display: 'grid',
                gap: '0.75rem'
              }}
            >
              {chatMessages.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Not sure where to start? Try asking for key takeaways or definitions you want to
                  review.
                </p>
              ) : (
                chatMessages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    style={{
                      justifySelf: message.role === 'user' ? 'end' : 'start',
                      maxWidth: '85%',
                      padding: '0.75rem 0.95rem',
                      borderRadius: '0.9rem',
                      background:
                        message.role === 'user'
                          ? 'var(--accent-gradient)'
                          : 'var(--surface-panel-contrast)',
                      color:
                        message.role === 'user'
                          ? 'var(--accent-text-contrast)'
                          : 'var(--text-secondary)',
                      boxShadow: 'var(--shadow-panel)',
                      display: 'grid',
                      gap: '0.35rem'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        opacity: 0.75,
                        letterSpacing: '0.02em'
                      }}
                    >
                      {message.role === 'user' ? 'You' : PROVIDER_LABELS[provider]}
                    </span>
                    <span style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{message.content}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleChatSubmit}
              style={{ display: 'grid', gap: '0.75rem', alignItems: 'flex-start' }}
            >
              <label htmlFor="chat-input" style={{ display: 'none' }}>
                Ask a question about the transcript
              </label>
              <textarea
                id="chat-input"
                value={chatInput}
                onChange={(event) => {
                  setChatInput(event.target.value);
                  if (chatError) {
                    setChatError(null);
                  }
                }}
                placeholder="Ask about key points, definitions, or next steps..."
                rows={3}
                disabled={isChatting}
                style={{
                  resize: 'vertical',
                  minHeight: '3.5rem',
                  padding: '0.8rem 0.95rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-input)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'inherit',
                  lineHeight: 1.55
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={isChatting || !chatInput.trim()}
                  style={{
                    padding: '0.75rem 1.35rem',
                    borderRadius: '999px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: isChatting || !chatInput.trim() ? 'not-allowed' : 'pointer',
                    color: 'var(--accent-text-contrast)',
                    background:
                      isChatting || !chatInput.trim()
                        ? 'var(--accent-gradient-muted)'
                        : 'var(--accent-gradient-alt)'
                  }}
                >
                  {isChatting ? 'Thinking…' : 'Send'}
                </button>
                {chatError && (
                  <span style={{ color: 'var(--status-error)', fontSize: '0.9rem' }}>{chatError}</span>
                )}
              </div>
            </form>
          </section>
          {(Object.keys(GENERATION_LABELS) as GenerationMode[])
            .map((mode) => ({ mode, output: getGeneration(mode) }))
            .filter((entry) => entry.output)
            .map((entry) => (
              <section
                key={entry.mode}
                style={{
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  background: 'var(--surface-panel-soft)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gap: '0.75rem'
                }}
              >
                <header>
                  <h3 style={{ marginBottom: '0.35rem' }}>{GENERATION_LABELS[entry.mode]}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {GENERATION_DESCRIPTIONS[entry.mode]}
                  </p>
                </header>
                <MarkdownOutput content={entry.output} />
              </section>
            ))}
        </article>
      )}
    </section>
  );
}























