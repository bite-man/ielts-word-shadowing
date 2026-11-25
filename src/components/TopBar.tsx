import type { RefObject } from 'react';
import {
  Keyboard,
  LayoutGrid,
  List,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import type { FilterMode, ThemeMode, ViewMode } from '../types';

interface TopBarProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  filterMode: FilterMode;
  viewMode: ViewMode;
  theme: ThemeMode;
  counts: {
    all: number;
    starred: number;
    unmastered: number;
    mastered: number;
  };
  onSearchChange: (q: string) => void;
  onFilterChange: (mode: FilterMode) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
  onOpenMobileSidebar: () => void;
}

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'starred', label: '生词' },
  { id: 'unmastered', label: '未掌握' },
  { id: 'mastered', label: '已掌握' },
];

export function TopBar({
  title,
  subtitle,
  searchQuery,
  searchInputRef,
  filterMode,
  viewMode,
  theme,
  counts,
  onSearchChange,
  onFilterChange,
  onViewModeChange,
  onToggleTheme,
  onOpenShortcuts,
  onOpenMobileSidebar,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3">
        {/* Left: menu + current unit title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="打开词表目录"
            className="lg:hidden rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="font-serif-display text-lg sm:text-xl font-semibold leading-tight text-[var(--text-primary)] truncate">
              {title}
            </h2>
            <p className="text-xs text-[var(--text-muted)] truncate">{subtitle}</p>
          </div>
        </div>

        {/* Right: global search + utility controls */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜全库单词或序号 (按 /)"
              aria-label="搜索单词或序号"
              className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1.5 pl-8 pr-7 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="清除搜索"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div
            className="hidden sm:flex items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0.5"
            role="group"
            aria-label="切换视图"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-pressed={viewMode === 'grid'}
              title="网格视图（适合对照纸质书）"
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-pressed={viewMode === 'list'}
              title="列表视图"
              className={`rounded p-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenShortcuts}
            title="键盘快捷键 (?)"
            aria-label="查看键盘快捷键"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? '切换到深色护眼模式' : '切换到暖纸浅色模式'}
            aria-label="切换深浅色主题"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Filter pills row */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pb-2.5 overflow-x-auto">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="筛选单词">
          {FILTERS.map((f) => {
            const active = filterMode === f.id;
            const count = counts[f.id];
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span>{f.label}</span>
                <span className="font-mono-num opacity-75">{count}</span>
              </button>
            );
          })}
        </div>

        <p className="hidden md:block text-xs text-[var(--text-muted)] whitespace-nowrap">
          单击单词立即发音 · <kbd className="font-mono-num">Space</kbd> 播放/暂停 ·{' '}
          <kbd className="font-mono-num">← →</kbd> 切词
        </p>
      </div>
    </header>
  );
}
