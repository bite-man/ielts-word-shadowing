export interface WordItem {
  id: string;
  index: number;
  indexStr: string;
  word: string;
  filename: string;
  listName: string;
  unitName: string;
  audioUrl: string;
}

export interface UnitData {
  id: string;
  name: string;
  listName: string;
  wordCount: number;
  words: WordItem[];
}

export interface WordListData {
  id: string;
  name: string;
  wordCount: number;
  unitCount: number;
  units: UnitData[];
}

export interface CatalogResponse {
  audioRoot: string;
  totalLists: number;
  totalUnits: number;
  totalWords: number;
  lists: WordListData[];
}

export type FilterMode = 'all' | 'starred' | 'unmastered' | 'mastered';
export type ViewMode = 'grid' | 'list';
export type ThemeMode = 'light' | 'dark';

export interface ShadowSettings {
  playbackRate: number;      // 0.75 | 0.9 | 1 | 1.15 | 1.3
  repeatCount: number;       // 1 | 2 | 3
  shadowGapSec: number;      // 0.8 | 1.5 | 2.2 | 3.0
  shuffle: boolean;
  loopSingle: boolean;
  autoScroll: boolean;
}

export interface StudyPersistedState {
  starred: Record<string, true>;
  mastered: Record<string, true>;
  playCounts: Record<string, number>;
  customLabels: Record<string, string>;
  lastListId: string | null;
  lastUnitId: string | null;
  lastWordId: string | null;
  theme: ThemeMode;
  viewMode: ViewMode;
  settings: ShadowSettings;
}
