import type { RunState } from '../../engine/types';
import {
  buildChapterSummary,
  CHAPTER_SUMMARY_COUNTDOWN,
  CHAPTER_SUMMARY_GUIDE,
} from '../../story/ch1Summary';

interface ChapterSummaryProps {
  run: RunState;
  onContinue: () => void;
}

/** C1-010 章末小结屏：条件摘要 + 倒计时锚 + 固定引导语。 */
export function ChapterSummary({ run, onContinue }: ChapterSummaryProps) {
  const lines = buildChapterSummary(run.flags);

  return (
    <div className="chapter-summary">
      <div className="chapter-summary__card">
        <div className="chapter-summary__kicker">第一章 · 回声小结</div>
        <h2 className="chapter-summary__title">空出来的座位</h2>
        <ul className="chapter-summary__list">
          {lines.map((line) => (
            <li key={line.id}>{line.text}</li>
          ))}
        </ul>
        <div className="chapter-summary__clock">{CHAPTER_SUMMARY_COUNTDOWN}</div>
        <div className="chapter-summary__guide">{CHAPTER_SUMMARY_GUIDE}</div>
        <button
          type="button"
          className="chapter-summary__continue"
          onClick={(event) => {
            event.stopPropagation();
            onContinue();
          }}
        >
          继续
        </button>
      </div>
    </div>
  );
}
