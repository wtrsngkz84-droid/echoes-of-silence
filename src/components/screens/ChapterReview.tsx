import { useGame } from '../../state/GameContext';
import type { ChapterId } from '../../engine/types';
import { CLUES } from '../../story/clues';
import '../../styles/screens.css';

interface ChapterReviewProps {
  open: boolean;
  onClose: () => void;
}

const CHAPTER_NAMES: Partial<Record<ChapterId, string>> = {
  ch1: '第一章 · 空出来的座位',
  ch2: '第二章 · 失控的群聊',
  ch3: '第三章 · 沉默的旁观者',
};

/** 章节回顾（FR-09/GD §8.3）：已完成章节 + 证据图鉴摘要。 */
export function ChapterReview({ open, onClose }: ChapterReviewProps) {
  const { state } = useGame();
  if (!open) return null;
  const completed = state.meta.completedChapters ?? [];

  return (
    <div className="meta-overlay" role="dialog" aria-label="章节回顾" onClick={onClose}>
      <div className="meta-panel" onClick={(event) => event.stopPropagation()}>
        <header className="meta-panel__head">
          <div>
            <div className="meta-panel__kicker">章节回顾</div>
            <div className="meta-panel__title">已走过的十二天</div>
          </div>
          <button type="button" className="meta-panel__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <div className="review-section">
          <div className="review-label">已完成章节</div>
          {completed.length === 0 ? (
            <p className="review-empty">还没有走完任何一章。</p>
          ) : (
            <ul className="review-list">
              {completed.map((chapter) => (
                <li key={chapter}>{CHAPTER_NAMES[chapter] ?? chapter}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="review-section">
          <div className="review-label">证据图鉴</div>
          <ul className="review-list">
            {state.meta.clueLog.map((id) => (
              <li key={id}>
                {id} · {CLUES[id]?.name ?? '未知证据'}
              </li>
            ))}
            {state.meta.clueLog.length === 0 && <li>尚未收集证据。</li>}
          </ul>
        </div>

        <div className="review-section">
          <div className="review-label">结局</div>
          <p className="review-empty">
            {state.meta.endingsSeen.length > 0
              ? `已见：${state.meta.endingsSeen.join(' / ')}`
              : '尚未抵达结局。'}
          </p>
        </div>
      </div>
    </div>
  );
}