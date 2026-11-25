import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Pencil,
  RotateCcw,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import type { PlayerPhase } from '../hooks/useAudioPlayer';
import type { ViewMode, WordItem } from '../types';

interface WordGridProps {
  words: WordItem[];
  viewMode: ViewMode;
  showSourceBadge: boolean;
  currentWordId: string | null;
  phase: PlayerPhase;
  autoScroll: boolean;
  starred: Record<string, true>;
  mastered: Record<string, true>;
  playCounts: Record<string, number>;
  customLabels: Record<string, string>;
  emptyTitle: string;
  emptyDescription: string;
  onResetFilters?: () => void;
  onPlayWord: (word: WordItem) => void;
  onToggleStar: (wordId: string) => void;
  onToggleMastered: (wordId: string) => void;
  onSetCustomLabel: (wordId: string, label: string) => void;
}

function compactLocation(listName: string, unitName: string) {
  const l = listName.replace(/Word\s*List\s*/i, 'L');
  const u = unitName.replace(/Unit\s*/i, 'U');
  return `${l}·${u}`;
}

export function WordGrid({
  words,
  viewMode,
  showSourceBadge,
  currentWordId,
  phase,
  autoScroll,
  starred,
  mastered,
  playCounts,
  customLabels,
  emptyTitle,
  emptyDescription,
  onResetFilters,
  onPlayWord,
  onToggleStar,
  onToggleMastered,
  onSetCustomLabel,
}: WordGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const activeItemRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (autoScroll && currentWordId && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [autoScroll, currentWordId]);

  const startEdit = (word: WordItem) => {
    setEditingId(word.id);
    setDraftLabel(customLabels[word.id] ?? word.word);
  };

  const commitEdit = (word: WordItem) => {
    const trimmed = draftLabel.trim();
    if (!trimmed || trimmed === word.word) {
      onSetCustomLabel(word.id, '');
    } else {
      onSetCustomLabel(word.id, trimmed);
    }
    setEditingId(null);
  };

  if (words.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-20 px-4 text-center"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">
          <Volume2 className="h-5 w-5" />
        </div>
        <h3 className="text-base font-medium text-[var(--text-primary)]">{emptyTitle}</h3>
        <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{emptyDescription}</p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>重置筛选</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <ul
      role="list"
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5'
          : 'flex flex-col gap-1.5 max-w-3xl mx-auto'
      }
    >
      {words.map((word) => {
        const isCurrent = word.id === currentWordId;
        const isSpeaking = isCurrent && phase === 'playing';
        const isShadowing = isCurrent && phase === 'shadowing';
        const isStarred = Boolean(starred[word.id]);
        const isMastered = Boolean(mastered[word.id]);
        const count = playCounts[word.id] ?? 0;
        const displayWord = customLabels[word.id] ?? word.word;
        const isCustom = Boolean(customLabels[word.id]);
        const isEditing = editingId === word.id;

        return (
          <li
            key={word.id}
            ref={isCurrent ? activeItemRef : null}
            className={`group relative flex items-center rounded-lg border transition-all ${
              isCurrent
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_0_1px_var(--accent)]'
                : isMastered
                ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 hover:border-[var(--border-strong)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            {isEditing ? (
              <div className="flex flex-1 items-center gap-2 px-3 py-2.5">
                <span className="font-mono-num text-xs text-[var(--text-muted)] shrink-0">
                  {word.indexStr}
                </span>
                <input
                  type="text"
                  value={draftLabel}
                  autoFocus
                  aria-label="修正单词拼写"
                  onChange={(e) => setDraftLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitEdit(word);
                    } else if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-[var(--accent)] bg-[var(--bg-canvas)] px-2 py-0.5 text-sm text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => commitEdit(word)}
                  aria-label="保存拼写"
                  className="rounded p-1 text-[var(--accent)] hover:bg-[var(--bg-elevated)]"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label="取消编辑"
                  className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Main clickable play trigger */}
                <button
                  type="button"
                  onClick={() => onPlayWord(word)}
                  className={`flex flex-1 items-center gap-3 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-l-lg ${
                    viewMode === 'grid' ? 'px-3 py-3' : 'px-3.5 py-2.5'
                  }`}
                >
                  {/* Index number / equalizer */}
                  <span className="flex h-6 w-8 shrink-0 items-center justify-center">
                    {isSpeaking ? (
                      <span
                        className="flex items-end gap-[2px] h-3.5"
                        aria-label="正在播放"
                      >
                        <span className="w-[3px] h-full rounded-full bg-[var(--accent)] eq-bar-1" />
                        <span className="w-[3px] h-full rounded-full bg-[var(--accent)] eq-bar-2" />
                        <span className="w-[3px] h-full rounded-full bg-[var(--accent)] eq-bar-3" />
                      </span>
                    ) : (
                      <span
                        className={`font-mono-num text-xs ${
                          isCurrent
                            ? 'font-semibold text-[var(--accent)]'
                            : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                        }`}
                      >
                        {word.indexStr}
                      </span>
                    )}
                  </span>

                  {/* Word text + metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`truncate text-[15px] leading-snug ${
                          isCurrent
                            ? 'font-semibold text-[var(--accent)]'
                            : isMastered
                            ? 'font-medium text-[var(--text-muted)]'
                            : 'font-medium text-[var(--text-primary)]'
                        }`}
                      >
                        {displayWord}
                      </span>
                      {isCustom && (
                        <span
                          title={`原文件名: ${word.word}`}
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]/60"
                        />
                      )}
                    </div>

                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      {showSourceBadge && (
                        <span className="font-mono-num">
                          {compactLocation(word.listName, word.unitName)}
                        </span>
                      )}
                      {isShadowing && (
                        <span className="font-medium text-[var(--accent)]">请跟读…</span>
                      )}
                      {!isShadowing && count > 0 && (
                        <span className="font-mono-num">×{count}</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Secondary actions */}
                <div className="flex items-center gap-0.5 pr-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(word)}
                    title="修正显示拼写（不改动原音频文件）"
                    aria-label={`修正 ${displayWord} 拼写`}
                    className="rounded p-1.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-opacity"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStar(word.id)}
                    title={isStarred ? '移出生词本 (S)' : '加入生词本 (S)'}
                    aria-label={isStarred ? `取消收藏 ${displayWord}` : `收藏 ${displayWord}`}
                    aria-pressed={isStarred}
                    className={`rounded p-1.5 transition-colors ${
                      isStarred
                        ? 'text-[var(--star)] hover:bg-[var(--star-soft)]'
                        : 'text-[var(--text-muted)] opacity-50 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] hover:text-[var(--star)]'
                    }`}
                  >
                    <Star className="h-3.5 w-3.5" fill={isStarred ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleMastered(word.id)}
                    title={isMastered ? '取消已掌握 (M)' : '标记已掌握 (M)'}
                    aria-label={isMastered ? `取消已掌握 ${displayWord}` : `标记 ${displayWord} 已掌握`}
                    aria-pressed={isMastered}
                    className={`rounded p-1.5 transition-colors ${
                      isMastered
                        ? 'text-[var(--accent)] hover:bg-[var(--accent-soft)]'
                        : 'text-[var(--text-muted)] opacity-40 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)]'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
