import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import type { ChapterId } from '../../engine/types';
import { STORY_INDEX } from '../../story/index';
import { PixelButton } from '../ui/PixelButton';
import { EndingGallery } from './EndingGallery';
import { ChapterReview } from './ChapterReview';
import '../../styles/screens.css';

const CHAPTER_LABELS: Partial<Record<ChapterId, string>> = {
  ch1: '第一章',
  ch2: '第二章',
  ch3: '第三章',
};

export function TitleScreen() {
  const { state, continueRun, startRun, openWarning } = useGame();
  const [confirmNew, setConfirmNew] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [carry, setCarry] = useState(true);

  const unlocked = (['ch1', 'ch2', 'ch3'] as ChapterId[]).filter(
    (chapter) =>
      state.meta.unlockedChapters.includes(chapter) &&
      Boolean(STORY_INDEX.chapterStarts[chapter]),
  );
  const showChapterSelect =
    !state.hasSave && (state.meta.firstRunCompleted || unlocked.length > 1);
  const carried = state.meta.carriedFlags;
  const hasCarried = Boolean(carried && Object.keys(carried).length > 0);

  const startNew = () => {
    if (state.hasSave) {
      setConfirmNew(true);
      return;
    }
    openWarning('ch1');
  };

  return (
    <div className="title-screen">
      <h1 className="title-screen__logo">沉默的回声</h1>
      <div className="title-screen__sub">ECHOES OF SILENCE</div>
      <div className="title-screen__menu">
        <PixelButton variant="accent" onClick={startNew}>
          开始游戏
        </PixelButton>
        <PixelButton disabled={!state.hasSave} onClick={continueRun}>
          继续游戏
        </PixelButton>
        <PixelButton onClick={() => openWarning('3min')}>3 分钟体验</PixelButton>
      </div>

      {showChapterSelect && (
        <div className="chapter-select">
          <div className="chapter-select__label">从章节开始</div>
          {hasCarried && (
            <label className="chapter-select__carry">
              <input
                type="checkbox"
                checked={carry}
                onChange={(event) => setCarry(event.target.checked)}
              />
              携带上次选择
            </label>
          )}
          <div className="chapter-select__buttons">
            {unlocked.map((chapter) => (
              <PixelButton
                key={chapter}
                onClick={() => startRun(chapter, carry && hasCarried ? carried : undefined)}
              >
                {CHAPTER_LABELS[chapter] ?? chapter}
              </PixelButton>
            ))}
          </div>
        </div>
      )}

      <div className="meta-links">
        {state.meta.endingsSeen.length > 0 && (
          <PixelButton variant="ghost" onClick={() => setGalleryOpen(true)}>
            结局画廊
          </PixelButton>
        )}
        {(state.meta.completedChapters ?? []).length > 0 && (
          <PixelButton variant="ghost" onClick={() => setReviewOpen(true)}>
            章节回顾
          </PixelButton>
        )}
      </div>

      <div className="title-screen__foot">
        <span>
          <span className="badge">全三章 · 正式剧本</span> 结局判定沿用四变量矩阵
        </span>
        <span>同一周 · 三个视角 · 你的选择决定回声落点</span>
      </div>

      <EndingGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <ChapterReview open={reviewOpen} onClose={() => setReviewOpen(false)} />

      {confirmNew && (
        <div
          className="confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="开始新游戏确认"
          onClick={() => setConfirmNew(false)}
        >
          <div className="confirm-panel pixel-panel" onClick={(event) => event.stopPropagation()}>
            <h2 className="confirm-panel__title">开始新游戏？</h2>
            <p className="confirm-panel__text">
              当前进度将被覆盖。结局图鉴与证据图鉴会保留。
            </p>
            <div className="confirm-panel__actions">
              <PixelButton onClick={() => setConfirmNew(false)}>取消</PixelButton>
              <PixelButton
                variant="accent"
                onClick={() => {
                  setConfirmNew(false);
                  openWarning('ch1');
                }}
              >
                覆盖并重新开始
              </PixelButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
