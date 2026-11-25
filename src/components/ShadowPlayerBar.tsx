import {
  Check,
  Mic,
  Pause,
  Play,
  Radio,
  Repeat1,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Square,
  Star,
} from 'lucide-react';
import type { PlayerPhase } from '../hooks/useAudioPlayer';
import type { RecorderState } from '../hooks/useVoiceRecorder';
import type { ShadowSettings, WordItem } from '../types';

interface ShadowPlayerBarProps {
  currentWord: WordItem | null;
  displayLabel: string;
  phase: PlayerPhase;
  isAutoPlay: boolean;
  currentRepeat: number;
  gapProgress: number;
  settings: ShadowSettings;
  isStarred: boolean;
  isMastered: boolean;
  audioError: string | null;
  recorderState: RecorderState;
  recorderError: string | null;
  onTogglePlayPause: () => void;
  onReplay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleAutoPlay: () => void;
  onToggleStar: () => void;
  onToggleMastered: () => void;
  onUpdateSettings: (patch: Partial<ShadowSettings>) => void;
  onToggleRecord: () => void;
}

const RATES = [0.75, 0.9, 1, 1.15, 1.3];
const REPEATS = [1, 2, 3];
const GAPS = [0.8, 1.5, 2.2, 3.0];

function cycleValue<T>(arr: T[], current: T): T {
  const idx = arr.indexOf(current);
  return arr[(idx + 1) % arr.length];
}

export function ShadowPlayerBar({
  currentWord,
  displayLabel,
  phase,
  isAutoPlay,
  currentRepeat,
  gapProgress,
  settings,
  isStarred,
  isMastered,
  audioError,
  recorderState,
  recorderError,
  onTogglePlayPause,
  onReplay,
  onPrev,
  onNext,
  onToggleAutoPlay,
  onToggleStar,
  onToggleMastered,
  onUpdateSettings,
  onToggleRecord,
}: ShadowPlayerBarProps) {
  const isPlayingOrShadowing = phase === 'playing' || phase === 'shadowing';
  const statusBanner = recorderError || audioError;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md">
      {/* Shadowing countdown bar */}
      <div className="h-[3px] w-full bg-[var(--bg-elevated)] overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] transition-none"
          style={{
            width:
              phase === 'shadowing'
                ? `${Math.max(0, Math.min(100, (1 - gapProgress) * 100))}%`
                : phase === 'playing'
                ? '100%'
                : '0%',
            opacity: phase === 'idle' || phase === 'paused' ? 0 : 1,
          }}
        />
      </div>

      {statusBanner && (
        <div
          role="alert"
          className="bg-[var(--danger-soft)] px-4 py-1 text-center text-xs text-[var(--danger)]"
        >
          {statusBanner}
        </div>
      )}

      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-2.5 sm:px-6 md:flex-row md:items-center md:justify-between">
        {/* Left: current active word */}
        <div className="flex items-center justify-between gap-3 md:min-w-[220px] md:max-w-[280px]">
          {currentWord ? (
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-mono-num text-xs text-[var(--text-muted)] shrink-0">
                  {currentWord.indexStr}
                </span>
                <span className="font-serif-display text-lg font-semibold text-[var(--text-primary)] truncate">
                  {displayLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="truncate">
                  {currentWord.listName} · {currentWord.unitName}
                </span>
                {phase === 'shadowing' && (
                  <span className="shrink-0 font-medium text-[var(--accent)]">请跟读</span>
                )}
                {phase === 'playing' && settings.repeatCount > 1 && (
                  <span className="shrink-0 font-mono-num text-[var(--accent)]">
                    {currentRepeat}/{settings.repeatCount}
                  </span>
                )}
                {recorderState === 'recording' && (
                  <span className="shrink-0 font-medium text-[var(--danger)]">录音中…</span>
                )}
                {recorderState === 'comparing' && (
                  <span className="shrink-0 font-medium text-[var(--accent)]">原音对比回放…</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[var(--text-muted)]">
              点击上方任意单词开始跟读
            </div>
          )}

          {currentWord && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onToggleStar}
                title="生词本 (S)"
                aria-label="切换当前词星标"
                aria-pressed={isStarred}
                className={`rounded-md p-1.5 transition-colors ${
                  isStarred
                    ? 'bg-[var(--star-soft)] text-[var(--star)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <Star className="h-4 w-4" fill={isStarred ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                onClick={onToggleMastered}
                title="已掌握 (M)"
                aria-label="切换当前词已掌握"
                aria-pressed={isMastered}
                className={`rounded-md p-1.5 transition-colors ${
                  isMastered
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Center: transport & shadowing controls */}
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            title="上一个词 (←)"
            aria-label="上一个词"
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlayPause}
            title="播放 / 暂停 (Space)"
            aria-label={isPlayingOrShadowing ? '暂停' : '播放'}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            {isPlayingOrShadowing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            title="下一个词 (→)"
            aria-label="下一个词"
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onReplay}
            title="重播当前词 (R)"
            aria-label="重播当前词"
            className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-[var(--border-subtle)]" />

          {/* Auto-play shadowing toggle */}
          <button
            type="button"
            onClick={onToggleAutoPlay}
            aria-pressed={isAutoPlay}
            title="自动连播跟读：播完自动停顿留白，再播下一词 (A)"
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isAutoPlay
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                : 'border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>{isAutoPlay ? '连播中' : '连播跟读'}</span>
          </button>

          {/* Voice record & compare */}
          <button
            type="button"
            onClick={onToggleRecord}
            disabled={!currentWord}
            title="录下自己的跟读，自动原音+自己录音对比 (V)"
            aria-label="录音对比跟读"
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
              recorderState === 'recording'
                ? 'bg-[var(--danger)] text-white'
                : recorderState === 'comparing'
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
            }`}
          >
            {recorderState === 'recording' ? (
              <>
                <Square className="h-3 w-3 fill-current" />
                <span className="hidden sm:inline">停止</span>
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">录音对比</span>
              </>
            )}
          </button>
        </div>

        {/* Right: compact tuning chips */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-1.5">
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ playbackRate: cycleValue(RATES, settings.playbackRate) })
            }
            title="点击切换语速"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 font-mono-num text-xs text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors"
          >
            {settings.playbackRate}x
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ repeatCount: cycleValue(REPEATS, settings.repeatCount) })
            }
            title="点击切换每词连读遍数"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="font-mono-num">{settings.repeatCount}</span>遍
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ shadowGapSec: cycleValue(GAPS, settings.shadowGapSec) })
            }
            title="点击切换跟读留白停顿时间"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors"
          >
            停<span className="font-mono-num">{settings.shadowGapSec}s</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ loopSingle: !settings.loopSingle })}
            aria-pressed={settings.loopSingle}
            title="单曲循环当前词"
            aria-label="单曲循环当前词"
            className={`rounded-md p-1.5 border transition-colors ${
              settings.loopSingle
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Repeat1 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ shuffle: !settings.shuffle })}
            aria-pressed={settings.shuffle}
            title="随机抽查顺序"
            aria-label="随机抽查顺序"
            className={`rounded-md p-1.5 border transition-colors ${
              settings.shuffle
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
