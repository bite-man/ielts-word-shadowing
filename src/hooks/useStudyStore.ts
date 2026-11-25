import { useCallback, useEffect, useState } from 'react';
import type {
  ShadowSettings,
  StudyPersistedState,
  ThemeMode,
  ViewMode,
} from '../types';

const STORAGE_KEY = 'ielts-word-audio:v1';

const DEFAULT_SETTINGS: ShadowSettings = {
  playbackRate: 1,
  repeatCount: 1,
  shadowGapSec: 1.5,
  shuffle: false,
  loopSingle: false,
  autoScroll: true,
};

const DEFAULT_STATE: StudyPersistedState = {
  starred: {},
  mastered: {},
  playCounts: {},
  customLabels: {},
  lastListId: null,
  lastUnitId: null,
  lastWordId: null,
  theme: 'light',
  viewMode: 'grid',
  settings: DEFAULT_SETTINGS,
};

function loadInitialState(): StudyPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StudyPersistedState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      starred: parsed.starred ?? {},
      mastered: parsed.mastered ?? {},
      playCounts: parsed.playCounts ?? {},
      customLabels: parsed.customLabels ?? {},
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useStudyStore() {
  const [state, setState] = useState<StudyPersistedState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const toggleStar = useCallback((wordId: string) => {
    setState((prev) => {
      const next = { ...prev.starred };
      if (next[wordId]) {
        delete next[wordId];
      } else {
        next[wordId] = true;
      }
      return { ...prev, starred: next };
    });
  }, []);

  const toggleMastered = useCallback((wordId: string) => {
    setState((prev) => {
      const next = { ...prev.mastered };
      if (next[wordId]) {
        delete next[wordId];
      } else {
        next[wordId] = true;
      }
      return { ...prev, mastered: next };
    });
  }, []);

  const incrementPlayCount = useCallback((wordId: string) => {
    setState((prev) => ({
      ...prev,
      playCounts: {
        ...prev.playCounts,
        [wordId]: (prev.playCounts[wordId] ?? 0) + 1,
      },
      lastWordId: wordId,
    }));
  }, []);

  const setCustomLabel = useCallback((wordId: string, label: string) => {
    const trimmed = label.trim();
    setState((prev) => {
      const next = { ...prev.customLabels };
      if (!trimmed) {
        delete next[wordId];
      } else {
        next[wordId] = trimmed;
      }
      return { ...prev, customLabels: next };
    });
  }, []);

  const setLastLocation = useCallback((listId: string | null, unitId: string | null) => {
    setState((prev) => ({
      ...prev,
      lastListId: listId,
      lastUnitId: unitId,
    }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode }));
  }, []);

  const updateSettings = useCallback((patch: Partial<ShadowSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  return {
    state,
    toggleStar,
    toggleMastered,
    incrementPlayCount,
    setCustomLabel,
    setLastLocation,
    setTheme,
    toggleTheme,
    setViewMode,
    updateSettings,
  };
}
