import type { RunState } from '../../engine/types';
import {
  buildChapterSummary,
  CHAPTER_SUMMARY_COUNTDOWN,
  CHAPTER_SUMMARY_GUIDE,
} from '../../story/ch1Summary';
import {
  buildChapter2Summary,
  CH2_SUMMARY_COUNTDOWN,
  CH2_SUMMARY_GUIDE,
} from '../../story/ch2Summary';

interface ChapterSummaryProps {
  run: RunState;
  onContinue: () => void;
}

/** C1-010 章末小结屏：条件摘要 + 倒计时锚 + 固定引导语。 */
export function ChapterSummary({ run, onContinue }: ChapterSummaryProps) {
  const isCh2 = run.chapter === 'ch2';
  const lines = isCh2 ? buildChapter2Summary(run.flags) : buildChapterSummary(run.flags);

  return (
    <div className="chapter-summary">
      <div className="chapter-summary__card">
        <div className="chapter-summary__kicker">
          {isCh2 ? '第二章 · 回声小结' : '第一章 · 回声小结'}
        </div>
        <h2 className="chapter-summary__title">
          {isCh2 ? '失控的群聊' : '空出来的座位'}
        </h2>
        <ul className="chapter-summary__list">
          {lines.map((line) => (
            <li key={line.id}>{line.text}</li>
          ))}
        </ul>
        <div className="chapter-summary__clock">
          {isCh2 ? CH2_SUMMARY_COUNTDOWN : CHAPTER_SUMMARY_COUNTDOWN}
        </div>
        <div className="chapter-summary__guide">
          {isCh2 ? CH2_SUMMARY_GUIDE : CHAPTER_SUMMARY_GUIDE}
        </div>
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
