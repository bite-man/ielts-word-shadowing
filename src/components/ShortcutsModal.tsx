import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Space', desc: '播放 / 暂停当前单词' },
  { key: '← / →', desc: '上一个 / 下一个单词并立即发音' },
  { key: 'R', desc: '重播当前单词' },
  { key: 'A', desc: '开启 / 关闭自动连播跟读' },
  { key: 'V', desc: '录音并自动原音对比' },
  { key: 'S', desc: '将当前词加入 / 移出生词本' },
  { key: 'M', desc: '将当前词标记 / 取消已掌握' },
  { key: '/', desc: '快速搜索全库单词或序号' },
  { key: '?', desc: '打开 / 关闭快捷键面板' },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <h3
            id="shortcuts-title"
            className="font-serif-display text-lg font-semibold text-[var(--text-primary)]"
          >
            键盘快捷键
          </h3>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="关闭快捷键说明"
            className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-[var(--text-muted)]">
          看纸质单词本时，眼睛无需离开书页，用键盘就能完成切换、复读与标星。
        </p>

        <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
          {SHORTCUTS.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-[var(--text-secondary)]">{item.desc}</span>
              <kbd className="rounded border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-2 py-0.5 font-mono-num text-xs text-[var(--text-primary)]">
                {item.key}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
