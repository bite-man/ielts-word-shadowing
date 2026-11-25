import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Star,
  X,
} from 'lucide-react';
import type { WordListData } from '../types';

interface SidebarProps {
  lists: WordListData[];
  selectedListId: string | null;
  selectedUnitId: string | null;
  isStarredCollection: boolean;
  totalWords: number;
  starredCount: number;
  mastered: Record<string, true>;
  playCounts: Record<string, number>;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectUnit: (listId: string, unitId: string) => void;
  onSelectStarredCollection: () => void;
}

export function Sidebar({
  lists,
  selectedListId,
  selectedUnitId,
  isStarredCollection,
  totalWords,
  starredCount,
  mastered,
  playCounts,
  isOpenMobile,
  onCloseMobile,
  onSelectUnit,
  onSelectStarredCollection,
}: SidebarProps) {
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (selectedListId) initial[selectedListId] = true;
    else if (lists[0]) initial[lists[0].id] = true;
    return initial;
  });

  const toggleList = (listId: string) => {
    setExpandedLists((prev) => ({ ...prev, [listId]: !prev[listId] }));
  };

  const masteredTotal = Object.keys(mastered).length;
  const practicedTotal = Object.keys(playCounts).length;

  const content = (
    <div className="flex h-full flex-col bg-[var(--bg-surface)] border-r border-[var(--border-subtle)]">
      {/* Brand header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--accent-contrast)]">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif-display text-base font-semibold leading-tight tracking-tight truncate">
              IELTS Audio
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] font-mono-num">
              {totalWords.toLocaleString()} words
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="关闭导航栏"
          className="lg:hidden rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Overall progress summary */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5">
          <span>跟读进度</span>
          <span className="font-mono-num">
            {practicedTotal}/{totalWords}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{
              width: totalWords > 0 ? `${Math.min(100, (practicedTotal / totalWords) * 100)}%` : '0%',
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>已掌握 {masteredTotal}</span>
          <span>生词 {starredCount}</span>
        </div>
      </div>

      {/* Starred collection shortcut */}
      <div className="px-2.5 pt-2.5 pb-1">
        <button
          type="button"
          onClick={() => {
            onSelectStarredCollection();
            onCloseMobile();
          }}
          className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors ${
            isStarredCollection
              ? 'bg-[var(--star-soft)] text-[var(--star)] font-medium'
              : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Star
              className="h-4 w-4 shrink-0"
              fill={isStarredCollection || starredCount > 0 ? 'currentColor' : 'none'}
            />
            <span>全部生词本</span>
          </span>
          <span className="font-mono-num text-xs opacity-80">{starredCount}</span>
        </button>
      </div>

      {/* Word Lists tree */}
      <nav aria-label="词表目录" className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
        {lists.map((list) => {
          const isExpanded = expandedLists[list.id] ?? list.id === selectedListId;
          const listPracticed = list.units.reduce(
            (sum, unit) =>
              sum + unit.words.filter((w) => (playCounts[w.id] ?? 0) > 0).length,
            0
          );

          return (
            <div key={list.id}>
              <button
                type="button"
                onClick={() => toggleList(list.id)}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                  )}
                  <span className="truncate">{list.name}</span>
                </span>
                <span className="font-mono-num text-[11px] text-[var(--text-muted)] shrink-0 ml-2">
                  {listPracticed}/{list.wordCount}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-0.5 ml-3 pl-2.5 border-l border-[var(--border-subtle)] space-y-0.5">
                  {list.units.map((unit) => {
                    const isActive = !isStarredCollection && selectedUnitId === unit.id;
                    const unitPracticed = unit.words.filter(
                      (w) => (playCounts[w.id] ?? 0) > 0
                    ).length;
                    const pct =
                      unit.wordCount > 0 ? Math.round((unitPracticed / unit.wordCount) * 100) : 0;

                    return (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={() => {
                          onSelectUnit(list.id, unit.id);
                          onCloseMobile();
                        }}
                        className={`group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                          isActive
                            ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <span className="truncate">{unit.name}</span>
                        <span className="flex items-center gap-2 shrink-0 ml-2">
                          {pct > 0 && (
                            <span
                              className="inline-block h-1.5 w-8 rounded-full bg-[var(--bg-elevated)] overflow-hidden"
                              title={`已跟读 ${unitPracticed}/${unit.wordCount}`}
                            >
                              <span
                                className="block h-full bg-[var(--accent)]"
                                style={{ width: `${pct}%` }}
                              />
                            </span>
                          )}
                          <span className="font-mono-num text-[11px] opacity-75">
                            {unit.wordCount}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-full">{content}</aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
