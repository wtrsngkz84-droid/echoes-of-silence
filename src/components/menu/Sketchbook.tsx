import '../../styles/game.css';

export interface SketchPage {
  id: string;
  date: string;
  note: string;
}

interface SketchbookProps {
  open: boolean;
  pages: SketchPage[];
  deletedMessages: string[];
  onClose: () => void;
}

/** 速写本（GD §3.6）：已解锁页 + 已删除的消息。 */
export function Sketchbook({ open, pages, deletedMessages, onClose }: SketchbookProps) {
  if (!open) return null;

  return (
    <div className="sketchbook" role="dialog" aria-label="速写本" onClick={onClose}>
      <div className="sketchbook__card" onClick={(event) => event.stopPropagation()}>
        <header className="sketchbook__head">
          <div>
            <div className="sketchbook__kicker">陈屿的速写本</div>
            <div className="sketchbook__title">良心账本</div>
          </div>
          <button type="button" className="sketchbook__close" onClick={onClose} aria-label="关闭速写本">
            ×
          </button>
        </header>

        <div className="sketchbook__section">
          <div className="sketchbook__label">已解锁的页</div>
          {pages.length === 0 ? (
            <p className="sketchbook__empty">还没有画下什么。</p>
          ) : (
            <ul className="sketchbook__pages">
              {pages.map((page) => (
                <li key={page.id}>
                  <span>{page.date}</span>
                  {page.note}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sketchbook__section">
          <div className="sketchbook__label">已删除的消息</div>
          {deletedMessages.length === 0 ? (
            <p className="sketchbook__empty">没有删掉的话。</p>
          ) : (
            <ul className="sketchbook__deleted">
              {deletedMessages.map((text, index) => (
                <li key={`${index}-${text}`}>{text}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}