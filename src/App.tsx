import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WordGrid } from './components/WordGrid';
import { ShadowPlayerBar } from './components/ShadowPlayerBar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { useCatalog } from './hooks/useCatalog';
import { useStudyStore } from './hooks/useStudyStore';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useVoiceRecorder } from './hooks/useVoiceRecorder';
import type { FilterMode, WordItem } from './types';

export default function App() {
  const { catalog, allWords, isLoading, error, refresh } = useCatalog();
  const {
    state,
    toggleStar,
    toggleMastered,
    incrementPlayCount,
    setCustomLabel,
    setLastLocation,
    toggleTheme,
    setViewMode,
    updateSettings,
  } = useStudyStore();

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isStarredCollection, setIsStarredCollection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Restore last visited unit once catalog loads
  useEffect(() => {
    if (!catalog || catalog.lists.length === 0 || selectedUnitId) return;

    const savedList = catalog.lists.find((l) => l.id === state.lastListId);
    const savedUnit = savedList?.units.find((u) => u.id === state.lastUnitId);
    if (savedList && savedUnit) {
      setSelectedListId(savedList.id);
      setSelectedUnitId(savedUnit.id);
      return;
    }

    const firstList = catalog.lists[0];
    const firstUnit = firstList?.units[0];
    if (firstList && firstUnit) {
      setSelectedListId(firstList.id);
      setSelectedUnitId(firstUnit.id);
    }
  }, [catalog, selectedUnitId, state.lastListId, state.lastUnitId]);

  const currentUnit = useMemo(() => {
    if (!catalog || !selectedListId || !selectedUnitId) return null;
    const list = catalog.lists.find((l) => l.id === selectedListId);
    return list?.units.find((u) => u.id === selectedUnitId) ?? null;
  }, [catalog, selectedListId, selectedUnitId]);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Base scope before filter pills
  const baseWords = useMemo<WordItem[]>(() => {
    if (trimmedQuery) {
      return allWords.filter((w) => {
        const label = (state.customLabels[w.id] ?? w.word).toLowerCase();
        return (
          label.includes(trimmedQuery) ||
          w.word.toLowerCase().includes(trimmedQuery) ||
          w.indexStr.includes(trimmedQuery) ||
          String(w.index) === trimmedQuery
        );
      });
    }
    if (isStarredCollection) {
      return allWords.filter((w) => Boolean(state.starred[w.id]));
    }
    return currentUnit?.words ?? [];
  }, [
    allWords,
    currentUnit,
    isStarredCollection,
    state.customLabels,
    state.starred,
    trimmedQuery,
  ]);

  const filterCounts = useMemo(() => {
    let starredCount = 0;
    let masteredCount = 0;
    for (const w of baseWords) {
      if (state.starred[w.id]) starredCount++;
      if (state.mastered[w.id]) masteredCount++;
    }
    return {
      all: baseWords.length,
      starred: starredCount,
      mastered: masteredCount,
      unmastered: baseWords.length - masteredCount,
    };
  }, [baseWords, state.mastered, state.starred]);

  const visibleWords = useMemo(() => {
    switch (filterMode) {
      case 'starred':
        return baseWords.filter((w) => Boolean(state.starred[w.id]));
      case 'mastered':
        return baseWords.filter((w) => Boolean(state.mastered[w.id]));
      case 'unmastered':
        return baseWords.filter((w) => !state.mastered[w.id]);
      default:
        return baseWords;
    }
  }, [baseWords, filterMode, state.mastered, state.starred]);

  const player = useAudioPlayer({
    playlist: visibleWords,
    settings: state.settings,
    onWordPlayed: incrementPlayCount,
  });

  const recorder = useVoiceRecorder();

  // Select last played word without auto-playing on first load
  const initializedWordRef = useRef(false);
  useEffect(() => {
    if (initializedWordRef.current || allWords.length === 0) return;
    initializedWordRef.current = true;
    const saved = state.lastWordId
      ? allWords.find((w) => w.id === state.lastWordId)
      : currentUnit?.words[0];
    if (saved) {
      player.selectWordOnly(saved);
    }
  }, [allWords, currentUnit, player, state.lastWordId]);

  const handleSelectUnit = (listId: string, unitId: string) => {
    setIsStarredCollection(false);
    setSearchQuery('');
    setFilterMode('all');
    setSelectedListId(listId);
    setSelectedUnitId(unitId);
    setLastLocation(listId, unitId);
  };

  const handleSelectStarredCollection = () => {
    setIsStarredCollection(true);
    setSearchQuery('');
    setFilterMode('all');
  };

  const handleToggleRecord = () => {
    if (!player.currentWord) return;
    player.pause();
    void recorder.startRecording(player.currentWord.audioUrl);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isTyping && target === searchInputRef.current) {
          setSearchQuery('');
          target.blur();
        }
        return;
      }

      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        player.togglePlayPause();
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        player.playNext();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        player.playPrev();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        player.replayCurrent();
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        player.toggleAutoPlay();
        return;
      }

      if ((e.key === 's' || e.key === 'S') && player.currentWord) {
        e.preventDefault();
        toggleStar(player.currentWord.id);
        return;
      }

      if ((e.key === 'm' || e.key === 'M') && player.currentWord) {
        e.preventDefault();
        toggleMastered(player.currentWord.id);
        return;
      }

      if ((e.key === 'v' || e.key === 'V') && player.currentWord) {
        e.preventDefault();
        player.pause();
        void recorder.startRecording(player.currentWord.audioUrl);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isShortcutsOpen, player, recorder, toggleMastered, toggleStar]);

  const headerTitle = trimmedQuery
    ? `搜索 “${searchQuery.trim()}”`
    : isStarredCollection
    ? '全部生词本'
    : currentUnit
    ? `${currentUnit.listName} · ${currentUnit.name}`
    : 'IELTS Word Audio';

  const headerSubtitle = trimmedQuery
    ? `在全部 ${catalog?.totalWords.toLocaleString() ?? 0} 个单词中找到 ${baseWords.length} 条匹配`
    : isStarredCollection
    ? `跨词表汇总 · 共 ${baseWords.length} 个收藏生词`
    : currentUnit
    ? `共 ${currentUnit.wordCount} 词 · 按单词本序号 001–${String(currentUnit.wordCount).padStart(3, '0')} 排列`
    : '正在准备词库…';

  const activeDisplayLabel = player.currentWord
    ? state.customLabels[player.currentWord.id] ?? player.currentWord.word
    : '';

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-canvas)] p-6">
        <div className="w-full max-w-md space-y-3" aria-busy="true" aria-label="正在加载词库">
          <div className="h-6 w-44 rounded bg-[var(--bg-elevated)] animate-pulse" />
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-canvas)] p-6">
        <div className="max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center">
          <h2 className="font-serif-display text-lg font-semibold text-[var(--text-primary)]">
            无法加载音频词库
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {error ?? '未能读取 Word_List_Audio 目录'}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>重新加载</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Sidebar
        lists={catalog.lists}
        selectedListId={selectedListId}
        selectedUnitId={selectedUnitId}
        isStarredCollection={isStarredCollection}
        totalWords={catalog.totalWords}
        starredCount={Object.keys(state.starred).length}
        mastered={state.mastered}
        playCounts={state.playCounts}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSelectUnit={handleSelectUnit}
        onSelectStarredCollection={handleSelectStarredCollection}
      />

      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <TopBar
          title={headerTitle}
          subtitle={headerSubtitle}
          searchQuery={searchQuery}
          searchInputRef={searchInputRef}
          filterMode={filterMode}
          viewMode={state.viewMode}
          theme={state.theme}
          counts={filterCounts}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilterMode}
          onViewModeChange={setViewMode}
          onToggleTheme={toggleTheme}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-36 md:pb-28">
          <WordGrid
            words={visibleWords}
            viewMode={state.viewMode}
            showSourceBadge={Boolean(trimmedQuery) || isStarredCollection}
            currentWordId={player.currentWord?.id ?? null}
            phase={player.phase}
            autoScroll={state.settings.autoScroll}
            starred={state.starred}
            mastered={state.mastered}
            playCounts={state.playCounts}
            customLabels={state.customLabels}
            emptyTitle={
              trimmedQuery
                ? '没有找到匹配的单词'
                : isStarredCollection
                ? '生词本还是空的'
                : '当前筛选下没有单词'
            }
            emptyDescription={
              trimmedQuery
                ? '试试输入单词前几个字母，或直接输入三位序号（如 042）。'
                : isStarredCollection
                ? '跟读遇到不熟的词时，点星星或按键盘 S 即可收入生词本。'
                : '切换回“全部”即可查看本单元完整词表。'
            }
            onResetFilters={
              filterMode !== 'all' || trimmedQuery
                ? () => {
                    setFilterMode('all');
                    setSearchQuery('');
                  }
                : undefined
            }
            onPlayWord={player.playWord}
            onToggleStar={toggleStar}
            onToggleMastered={toggleMastered}
            onSetCustomLabel={setCustomLabel}
          />
        </main>
      </div>

      <ShadowPlayerBar
        currentWord={player.currentWord}
        displayLabel={activeDisplayLabel}
        phase={player.phase}
        isAutoPlay={player.isAutoPlay}
        currentRepeat={player.currentRepeat}
        gapProgress={player.gapProgress}
        settings={state.settings}
        isStarred={Boolean(player.currentWord && state.starred[player.currentWord.id])}
        isMastered={Boolean(player.currentWord && state.mastered[player.currentWord.id])}
        audioError={player.audioError}
        recorderState={recorder.recorderState}
        recorderError={recorder.errorMessage}
        onTogglePlayPause={player.togglePlayPause}
        onReplay={player.replayCurrent}
        onPrev={player.playPrev}
        onNext={player.playNext}
        onToggleAutoPlay={player.toggleAutoPlay}
        onToggleStar={() => player.currentWord && toggleStar(player.currentWord.id)}
        onToggleMastered={() => player.currentWord && toggleMastered(player.currentWord.id)}
        onUpdateSettings={updateSettings}
        onToggleRecord={handleToggleRecord}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
