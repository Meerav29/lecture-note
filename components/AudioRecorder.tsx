'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export function AudioRecorder({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Canvas and audio visualization refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      streamRef.current = stream;
      setHasPermission(true);

      // Set up audio context for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      return stream;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(message);
      setHasPermission(false);
      throw err;
    }
  }, []);

  // Draw waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!canvas || !analyser || !dataArray) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.getByteTimeDomainData(dataArray);

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas with background
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--surface-input') || '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--accent-primary') || '#3b82f6';
    ctx.beginPath();

    const sliceWidth = rect.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * rect.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(rect.width, rect.height / 2);
    ctx.stroke();

    // Continue animation loop
    animationRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      let stream = streamRef.current;
      if (!stream || !stream.active) {
        stream = await requestPermission();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        onRecordingStop?.();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start visualization
      drawWaveform();

      onRecordingStart?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
    }
  }, [requestPermission, onRecordingComplete, onRecordingStart, onRecordingStop, drawWaveform]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, []);

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      // Restart animation
      if (!animationRef.current) {
        drawWaveform();
      }
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [isPaused, drawWaveform]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border-medium)',
        background: 'var(--surface-panel-faint)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Record Audio</h3>
        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: 'var(--status-error)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '120px',
          borderRadius: '0.5rem',
          background: 'var(--surface-input)',
          border: '1px solid var(--border-stronger)'
        }}
      />

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {!isRecording ? (
          <button
            onClick={startRecording}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--accent-text-contrast)',
              background: 'var(--accent-gradient)',
              transition: 'filter 150ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="6" />
            </svg>
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={togglePause}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: '1px solid var(--border-strong)',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                background: 'var(--surface-panel)',
                transition: 'filter 150ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isPaused ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5 3l8 5-8 5V3z" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="4" y="3" width="3" height="10" />
                    <rect x="9" y="3" width="3" height="10" />
                  </svg>
                  Pause
                </>
              )}
            </button>
            <button
              onClick={stopRecording}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#fff',
                background: 'var(--status-error)',
                transition: 'filter 150ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="4" y="4" width="8" height="8" />
              </svg>
              Stop Recording
            </button>
          </>
        )}
      </div>

      {error && (
        <p role="alert" style={{ color: 'var(--status-error)', margin: 0, fontSize: '0.9rem' }}>
          {error}
        </p>
      )}

      {!hasPermission && !isRecording && (
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
          Click &quot;Start Recording&quot; to grant microphone access and begin recording.
        </p>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
