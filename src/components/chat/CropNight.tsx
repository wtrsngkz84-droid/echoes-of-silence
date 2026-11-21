import { useEffect, useState } from 'react';
import type { CropContent } from '../../engine/types';

type CropPhase = 'select' | 'caption' | 'publishing';

interface CropNightProps {
  content: CropContent;
  onComplete: () => void;
}

/** 裁剪之夜（C2-004 / GAMEPLAY_DESIGN §3.3）：亲手选中 20:33 并发布。 */
export function CropNight({ content, onComplete }: CropNightProps) {
  const [phase, setPhase] = useState<CropPhase>('select');
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [softGuide, setSoftGuide] = useState(false);
  const [draftNote, setDraftNote] = useState<string | null>(null);

  useEffect(() => {
    if (!draftNote) return;
    const timer = window.setTimeout(() => setDraftNote(null), 1600);
    return () => window.clearTimeout(timer);
  }, [draftNote]);

  useEffect(() => {
    if (phase !== 'publishing') return;
    const timer = window.setTimeout(() => onComplete(), 900);
    return () => window.clearTimeout(timer);
  }, [phase, onComplete]);

  const chooseRow = (index: number) => {
    if (phase !== 'select') return;
    if (index === content.targetIndex) {
      setFeedback(null);
      setPhase('caption');
      return;
    }
    const nextWrong = wrongCount + 1;
    setWrongCount(nextWrong);
    setFeedback(content.wrongFeedback[index] ?? '截这张，没有用。');
    if (nextWrong >= (content.softGuideAfter ?? 3)) setSoftGuide(true);
  };

  const target = content.messages[content.targetIndex];

  return (
    <div className="crop-night" data-phase={phase}>
      <div className="crop-night__panel">
        <header className="crop-night__head">
          <div>
            <div className="crop-night__title">裁剪之夜</div>
            <div className="crop-night__sub">
              {phase === 'select' ? '点击任意一条消息截图' : '图已截好'}
            </div>
          </div>
          {phase === 'select' && (
            <span className="crop-night__count">错误次数 {wrongCount}</span>
          )}
        </header>

        {phase === 'select' ? (
          <div className="crop-night__body">
            {content.messages.map((row, index) => (
              <button
                key={`${row.time ?? 'row'}-${index}`}
                type="button"
                className={[
                  'crop-night__row',
                  `crop-night__row--${row.side}`,
                  softGuide && index === content.targetIndex ? 'crop-night__row--target' : '',
                ].join(' ').trim()}
                data-crop-index={index}
                onClick={(event) => {
                  event.stopPropagation();
                  chooseRow(index);
                }}
              >
                <span className="crop-night__bubble">{row.text}</span>
                {row.time && <span className="crop-night__time">{row.time}</span>}
              </button>
            ))}
            {feedback && <div className="crop-night__feedback">「截这张，没有用」</div>}
            {feedback && <div className="crop-night__inner">{feedback}</div>}
            {softGuide && (
              <div className="crop-night__guide">（内心）就发这条。</div>
            )}
          </div>
        ) : (
          <div className="crop-night__body crop-night__body--caption">
            <div className="crop-night__crop-card">
              <div className="crop-night__crop-head">{target.time}</div>
              <p>{target.text}</p>
            </div>
            <div className="crop-night__caption-label">配文（发布出去的永远是定稿）</div>
            <div className="crop-night__caption">{content.defaultCaption}</div>
            {draftNote && <div className="crop-night__draft">{draftNote}</div>}
            <div className="crop-night__actions">
              <button
                type="button"
                className="crop-night__ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  setDraftNote('更狠的版本在草稿层浮现，又逐字删掉了。——算了。真的东西就够了。');
                }}
              >
                写得更狠（草稿层）
              </button>
              <button
                type="button"
                className="crop-night__ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  setDraftNote('21:52 那一段被删掉，停了三秒，又加回来了。');
                }}
              >
                删掉 21:52（草稿层）
              </button>
              <button
                type="button"
                className="crop-night__send"
                disabled={phase === 'publishing'}
                onClick={(event) => {
                  event.stopPropagation();
                  setPhase('publishing');
                }}
              >
                {phase === 'publishing' ? '发送中…' : '发送'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}