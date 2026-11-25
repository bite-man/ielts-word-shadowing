import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'comparing' | 'error';

export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRecording, setHasRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedUrlRef = useRef<string | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const compareAudioRef = useRef<HTMLAudioElement | null>(null);

  const cleanupStream = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
      }
      compareAudioRef.current?.pause();
    };
  }, [cleanupStream]);

  const playCompareSequence = useCallback((originalUrl: string, userUrl: string) => {
    setState('comparing');
    const audio = compareAudioRef.current ?? new Audio();
    compareAudioRef.current = audio;

    audio.pause();
    audio.src = originalUrl;
    audio.onended = () => {
      window.setTimeout(() => {
        audio.src = userUrl;
        audio.onended = () => {
          setState('idle');
        };
        audio.onerror = () => {
          setState('idle');
        };
        void audio.play().catch(() => setState('idle'));
      }, 320);
    };
    audio.onerror = () => {
      setState('idle');
    };
    void audio.play().catch(() => setState('idle'));
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
  }, [cleanupStream]);

  const startRecording = useCallback(
    async (originalAudioUrl: string) => {
      setErrorMessage(null);
      if (state === 'recording') {
        stopRecording();
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setState('error');
        setErrorMessage('当前浏览器不支持麦克风录音');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        chunksRef.current = [];

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          cleanupStream();
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          if (recordedUrlRef.current) {
            URL.revokeObjectURL(recordedUrlRef.current);
          }
          const url = URL.createObjectURL(blob);
          recordedUrlRef.current = url;
          setHasRecording(true);
          playCompareSequence(originalAudioUrl, url);
        };

        recorder.start();
        setState('recording');

        // Auto stop after 3.5 seconds (ideal for single IELTS word shadowing)
        stopTimeoutRef.current = window.setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 3500);
      } catch {
        cleanupStream();
        setState('error');
        setErrorMessage('未获得麦克风权限，请在浏览器地址栏允许麦克风访问');
      }
    },
    [cleanupStream, playCompareSequence, state, stopRecording]
  );

  const replayComparison = useCallback(
    (originalAudioUrl: string) => {
      if (recordedUrlRef.current) {
        playCompareSequence(originalAudioUrl, recordedUrlRef.current);
      }
    },
    [playCompareSequence]
  );

  const clearError = useCallback(() => {
    setErrorMessage(null);
    if (state === 'error') setState('idle');
  }, [state]);

  return {
    recorderState: state,
    errorMessage,
    hasRecording,
    startRecording,
    stopRecording,
    replayComparison,
    clearError,
  };
}
