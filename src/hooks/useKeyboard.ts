import { useEffect } from 'react';

/** 全局键盘：Space/Enter 触发主操作，Escape 开关菜单，数字键选选项 */
export function useGameKeyboard(onPrimary: () => void, onEscape: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        onPrimary();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPrimary, onEscape]);
}
