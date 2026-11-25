import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShadowSettings, WordItem } from '../types';

export type PlayerPhase = 'idle' | 'playing' | 'shadowing' | 'paused';

interface UseAudioPlayerOptions {
  playlist: WordItem[];
  settings: ShadowSettings;
  onWordPlayed: (wordId: string) => void;
}

export function useAudioPlayer({
  playlist,
  settings,
  onWordPlayed,
}: UseAudioPlayerOptions) {
  const [currentWord, setCurrentWord] = useState<WordItem | null>(null);
  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [gapProgress, setGapProgress] = useState(0); // 0 to 1 during shadowing pause
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const gapTimerRef = useRef<number | null>(null);
  const gapRafRef = useRef<number | null>(null);

  // Refs to avoid stale closures inside audio callbacks
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const isAutoPlayRef = useRef(isAutoPlay);
  isAutoPlayRef.current = isAutoPlay;

  const currentWordRef = useRef(currentWord);
  currentWordRef.current = currentWord;

  const repeatIndexRef = useRef(1);
  const onWordPlayedRef = useRef(onWordPlayed);
  onWordPlayedRef.current = onWordPlayed;

  const clearGapTimers = useCallback(() => {
    if (gapTimerRef.current !== null) {
      window.clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
    if (gapRafRef.current !== null) {
      window.cancelAnimationFrame(gapRafRef.current);
      gapRafRef.current = null;
    }
    setGapProgress(0);
  }, []);

  const getNextWord = useCallback((fromWord: WordItem | null): WordItem | null => {
    const list = playlistRef.current;
    if (list.length === 0) return null;
    if (!fromWord) return list[0];

    if (settingsRef.current.shuffle && list.length > 1) {
      let nextIdx = Math.floor(Math.random() * list.length);
      if (list[nextIdx].id === fromWord.id) {
        nextIdx = (nextIdx + 1) % list.length;
      }
      return list[nextIdx];
    }

    const idx = list.findIndex((w) => w.id === fromWord.id);
    if (idx === -1) return list[0];
    if (idx + 1 < list.length) return list[idx + 1];
    return null; // Reached end of playlist
  }, []);

  const getPrevWord = useCallback((fromWord: WordItem | null): WordItem | null => {
    const list = playlistRef.current;
    if (list.length === 0) return null;
    if (!fromWord) return list[0];
    const idx = list.findIndex((w) => w.id === fromWord.id);
    if (idx <= 0) return list[0];
    return list[idx - 1];
  }, []);

  const preloadNext = useCallback(
    (word: WordItem) => {
      const next = getNextWord(word);
      if (!next) return;
      if (!preloadRef.current) {
        preloadRef.current = new Audio();
        preloadRef.current.preload = 'auto';
      }
      if (preloadRef.current.src !== window.location.origin + next.audioUrl) {
        preloadRef.current.src = next.audioUrl;
      }
    },
    [getNextWord]
  );

  const startPlayInternal = useCallback(
    (word: WordItem, repeatNumber: number, countPlay: boolean) => {
      clearGapTimers();
      setAudioError(null);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;

      setCurrentWord(word);
      currentWordRef.current = word;
      repeatIndexRef.current = repeatNumber;
      setCurrentRepeat(repeatNumber);
      setPhase('playing');

      audio.src = word.audioUrl;
      audio.playbackRate = settingsRef.current.playbackRate;

      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            if (countPlay) {
              onWordPlayedRef.current(word.id);
            }
            preloadNext(word);
          })
          .catch((err) => {
            if (err?.name !== 'AbortError') {
              setAudioError('音频播放被浏览器阻止或文件不可用');
              setPhase('idle');
            }
          });
      }
    },
    [clearGapTimers, preloadNext]
  );

  const runShadowGap = useCallback(
    (durationSec: number, onComplete: () => void) => {
      clearGapTimers();
      setPhase('shadowing');
      const durationMs = Math.max(250, durationSec * 1000);
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / durationMs);
        setGapProgress(progress);
        if (progress < 1) {
          gapRafRef.current = window.requestAnimationFrame(tick);
        }
      };
      gapRafRef.current = window.requestAnimationFrame(tick);

      gapTimerRef.current = window.setTimeout(() => {
        clearGapTimers();
        onComplete();
      }, durationMs);
    },
    [clearGapTimers]
  );

  // Attach ended handler once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleEnded = () => {
      const word = currentWordRef.current;
      if (!word) {
        setPhase('idle');
        return;
      }

      const { repeatCount, shadowGapSec, loopSingle } = settingsRef.current;

      // More repeats remaining for this word
      if (repeatIndexRef.current < repeatCount) {
        const nextRepeat = repeatIndexRef.current + 1;
        runShadowGap(shadowGapSec, () => {
          startPlayInternal(word, nextRepeat, false);
        });
        return;
      }

      // Single-word loop mode
      if (loopSingle) {
        runShadowGap(shadowGapSec, () => {
          startPlayInternal(word, 1, false);
        });
        return;
      }

      // Auto-play shadowing mode: pause for user to repeat, then move to next word
      if (isAutoPlayRef.current) {
        const next = getNextWord(word);
        if (next) {
          runShadowGap(shadowGapSec, () => {
            startPlayInternal(next, 1, true);
          });
        } else {
          setIsAutoPlay(false);
          isAutoPlayRef.current = false;
          setPhase('idle');
        }
        return;
      }

      setPhase('idle');
    };

    const handleError = () => {
      setAudioError('音频加载失败，请确认音频文件存在');
      setPhase('idle');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [getNextWord, runShadowGap, startPlayInternal]);

  // Live update playbackRate when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackRate;
    }
  }, [settings.playbackRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearGapTimers();
      audioRef.current?.pause();
    };
  }, [clearGapTimers]);

  const playWord = useCallback(
    (word: WordItem) => {
      startPlayInternal(word, 1, true);
    },
    [startPlayInternal]
  );

  const replayCurrent = useCallback(() => {
    const target = currentWordRef.current ?? playlistRef.current[0] ?? null;
    if (target) {
      startPlayInternal(target, 1, true);
    }
  }, [startPlayInternal]);

  const pause = useCallback(() => {
    clearGapTimers();
    audioRef.current?.pause();
    setIsAutoPlay(false);
    isAutoPlayRef.current = false;
    setPhase('paused');
  }, [clearGapTimers]);

  const togglePlayPause = useCallback(() => {
    if (phase === 'playing' || phase === 'shadowing') {
      pause();
      return;
    }
    const target = currentWordRef.current ?? playlistRef.current[0] ?? null;
    if (target) {
      startPlayInternal(target, 1, true);
    }
  }, [pause, phase, startPlayInternal]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlayRef.current) {
      setIsAutoPlay(false);
      isAutoPlayRef.current = false;
      clearGapTimers();
      audioRef.current?.pause();
      setPhase('paused');
      return;
    }

    const startWord = currentWordRef.current ?? playlistRef.current[0] ?? null;
    if (!startWord) return;
    setIsAutoPlay(true);
    isAutoPlayRef.current = true;
    startPlayInternal(startWord, 1, true);
  }, [clearGapTimers, startPlayInternal]);

  const playNext = useCallback(() => {
    const next = getNextWord(currentWordRef.current);
    if (next) {
      startPlayInternal(next, 1, true);
    }
  }, [getNextWord, startPlayInternal]);

  const playPrev = useCallback(() => {
    const prev = getPrevWord(currentWordRef.current);
    if (prev) {
      startPlayInternal(prev, 1, true);
    }
  }, [getPrevWord, startPlayInternal]);

  const selectWordOnly = useCallback((word: WordItem | null) => {
    setCurrentWord(word);
    currentWordRef.current = word;
  }, []);

  return {
    currentWord,
    phase,
    isAutoPlay,
    currentRepeat,
    gapProgress,
    audioError,
    playWord,
    replayCurrent,
    pause,
    togglePlayPause,
    toggleAutoPlay,
    playNext,
    playPrev,
    selectWordOnly,
  };
}
