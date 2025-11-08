'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useAnonymous } from '../../../contexts/AnonymousContext';
import { createClient } from '../../../lib/supabase/client';
import { AudioRecorder } from '../../../components/AudioRecorder';
import { GuestModeBanner } from '../../../components/GuestModeBanner';

function NewLectureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isAnonymous, setAnonymous } = useAnonymous();
  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'upload' || modeParam === 'record') {
      setMode(modeParam);
    }

    // Check if guest mode is enabled via URL parameter
    const guestParam = searchParams.get('guest');
    if (guestParam === 'true' && !user) {
      setAnonymous(true);
    }
  }, [searchParams, user, setAnonymous]);

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedAudio(blob);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      // Auto-fill title from filename
      if (!title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setTitle(fileName);
      }
    }
  };

  const uploadAudioToStorage = async (audioFile: File, userId: string): Promise<string> => {
    const fileExt = audioFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    console.log('Uploading to storage:', fileName);
    const { data, error } = await supabase.storage.from('lecture-audio').upload(fileName, audioFile);

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
    console.log('Storage upload success:', data.path);
    return data.path;
  };

  const transcribeAudio = async (audioFile: File) => {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? 'Transcription failed');
    }

    return await response.json();
  };

  const handleSubmit = async () => {
    const audioSource = mode === 'record' ? recordedAudio : file;
    if (!audioSource) {
      setError(mode === 'record' ? 'Please record audio first' : 'Please select a file');
      return;
    }

    // For anonymous users, redirect to /transcribe with the audio
    if (isAnonymous || !user) {
      // Convert Blob to File if needed
      const audioFile =
        audioSource instanceof File
          ? audioSource
          : new File([audioSource], 'recording.webm', { type: 'audio/webm' });

      // Store in sessionStorage for the transcribe page
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem('pendingAudioFile', reader.result as string);
        sessionStorage.setItem('pendingAudioFileName', audioFile.name);
        sessionStorage.setItem('pendingAudioType', audioFile.type);
        router.push('/transcribe');
      };
      reader.readAsDataURL(audioFile);
      return;
    }

    // For authenticated users, save to database
    if (!title.trim()) {
      setError('Please enter a title for your lecture');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      // Convert Blob to File if needed
      const audioFile =
        audioSource instanceof File
          ? audioSource
          : new File([audioSource], 'recording.webm', { type: 'audio/webm' });

      setUploadProgress(20);

      // Upload to storage
      const audioPath = await uploadAudioToStorage(audioFile, user.id);
      setUploadProgress(40);

      // Transcribe
      const transcriptData = await transcribeAudio(audioFile);
      setUploadProgress(70);

      // Save to database
      console.log('Inserting lecture with user_id:', user.id);
      console.log('Checking auth state:', await supabase.auth.getUser());

      const { data: lecture, error: dbError } = await supabase
        .from('lectures')
        .insert({
          user_id: user.id,
          title: title.trim(),
          audio_url: audioPath,
          transcript: transcriptData.transcript,
          duration: transcriptData.metadata?.duration ? Math.round(transcriptData.metadata.duration) : null,
          metadata: transcriptData.metadata || {}
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }
      console.log('Lecture saved successfully:', lecture);

      setUploadProgress(100);

      // Redirect to lecture view
      router.push(`/lecture/${lecture.id}`);
    } catch (err) {
      console.error('Error creating lecture:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : 'Failed to create lecture';
      setError(`Failed to create lecture: ${errorMessage}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <GuestModeBanner />
      <div className="interaction-panel" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => router.back()}
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
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Create New Lecture</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {mode === 'record'
            ? 'Record audio directly from your microphone'
            : 'Upload a pre-recorded lecture file'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.5rem',
          borderRadius: '0.75rem',
          background: 'var(--surface-panel-faint)',
          border: '1px solid var(--border-medium)',
          marginBottom: '2rem'
        }}
      >
        <button
          onClick={() => setMode('record')}
          disabled={isUploading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 600,
            cursor: isUploading ? 'not-allowed' : 'pointer',
            color: mode === 'record' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
            background: mode === 'record' ? 'var(--accent-gradient)' : 'transparent',
            transition: 'all 150ms ease'
          }}
        >
          🎤 Record Audio
        </button>
        <button
          onClick={() => setMode('upload')}
          disabled={isUploading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 600,
            cursor: isUploading ? 'not-allowed' : 'pointer',
            color: mode === 'upload' ? 'var(--accent-text-contrast)' : 'var(--text-secondary)',
            background: mode === 'upload' ? 'var(--accent-gradient)' : 'transparent',
            transition: 'all 150ms ease'
          }}
        >
          📁 Upload File
        </button>
      </div>

      {/* Title Input - only for authenticated users */}
      {!isAnonymous && user && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="title"
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}
          >
            Lecture Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Biology 101 - Cell Division"
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-stronger)',
              background: 'var(--surface-input)',
              color: 'var(--text-secondary)',
              fontSize: '1rem'
            }}
          />
        </div>
      )}

      {/* Recording Interface */}
      {mode === 'record' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          {recordedAudio && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
              ✓ Recording complete ({(recordedAudio.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </div>
      )}

      {/* Upload Interface */}
      {mode === 'upload' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="audioFile"
            style={{
              display: 'block',
              padding: '3rem 2rem',
              borderRadius: '0.75rem',
              border: '2px dashed var(--border-bold)',
              background: 'var(--surface-input)',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'all 150ms ease'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.background = 'var(--surface-panel-soft)';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-bold)';
              e.currentTarget.style.background = 'var(--surface-input)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) {
                const input = document.getElementById('audioFile') as HTMLInputElement;
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(droppedFile);
                input.files = dataTransfer.files;
                handleFileChange({ target: input } as any);
              }
              e.currentTarget.style.borderColor = 'var(--border-bold)';
              e.currentTarget.style.background = 'var(--surface-input)';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              {file ? file.name : 'Drop file here or click to browse'}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {file
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                : 'Supports MP3, WAV, M4A, WEBM'}
            </p>
            <input
              id="audioFile"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            background: 'rgba(252, 165, 165, 0.1)',
            border: '1px solid var(--status-error)',
            color: 'var(--status-error)',
            marginBottom: '1.5rem'
          }}
        >
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              height: '8px',
              borderRadius: '999px',
              background: 'var(--surface-panel-faint)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${uploadProgress}%`,
                background: 'var(--accent-gradient)',
                transition: 'width 300ms ease'
              }}
            />
          </div>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              marginTop: '0.5rem'
            }}
          >
            {uploadProgress < 30 ? 'Uploading audio...' : uploadProgress < 80 ? 'Transcribing...' : 'Saving...'}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={
          isUploading ||
          (user && !isAnonymous && !title.trim()) ||
          (mode === 'record' ? !recordedAudio : !file)
        }
        style={{
          width: '100%',
          padding: '1rem',
          borderRadius: '999px',
          border: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          cursor:
            isUploading ||
            (user && !isAnonymous && !title.trim()) ||
            (mode === 'record' ? !recordedAudio : !file)
              ? 'not-allowed'
              : 'pointer',
          color: 'var(--accent-text-contrast)',
          background:
            isUploading ||
            (user && !isAnonymous && !title.trim()) ||
            (mode === 'record' ? !recordedAudio : !file)
              ? 'var(--accent-gradient-muted)'
              : 'var(--accent-gradient-alt)',
          transition: 'filter 150ms ease'
        }}
      >
        {isUploading
          ? 'Processing...'
          : isAnonymous || !user
            ? (mode === 'record' ? 'Transcribe Recording' : 'Transcribe Upload')
            : (mode === 'record' ? 'Save & Transcribe Recording' : 'Upload & Transcribe')}
      </button>
    </div>
    </>
  );
}

export default function NewLecturePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewLectureContent />
    </Suspense>
  );
}
