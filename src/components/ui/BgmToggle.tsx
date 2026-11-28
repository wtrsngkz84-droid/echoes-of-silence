import { useBgm } from '../../audio/BgmContext';
import '../../styles/screens.css';

export function BgmToggle({ className = '' }: { className?: string }) {
  const { muted, toggleMuted } = useBgm();
  return (
    <button
      type="button"
      className={`bgm-toggle ${className}`.trim()}
      aria-pressed={muted}
      aria-label={muted ? '开启背景音乐' : '关闭背景音乐'}
      onClick={(event) => {
        event.stopPropagation();
        toggleMuted();
      }}
    >
      BGM {muted ? '关' : '开'}
    </button>
  );
}