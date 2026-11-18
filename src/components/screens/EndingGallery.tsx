import { useGame } from '../../state/GameContext';
import { ENDING_LIST } from '../../story/endings';
import '../../styles/screens.css';

interface EndingGalleryProps {
  open: boolean;
  onClose: () => void;
}

/** 结局画廊（FR-09）：endingsSeen 持久化，重开不丢。 */
export function EndingGallery({ open, onClose }: EndingGalleryProps) {
  const { state } = useGame();
  if (!open) return null;

  return (
    <div className="meta-overlay" role="dialog" aria-label="结局画廊" onClick={onClose}>
      <div className="meta-panel" onClick={(event) => event.stopPropagation()}>
        <header className="meta-panel__head">
          <div>
            <div className="meta-panel__kicker">结局画廊</div>
            <div className="meta-panel__title">
              {state.meta.endingsSeen.length} / {ENDING_LIST.length}
            </div>
          </div>
          <button type="button" className="meta-panel__close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>
        <div className="gallery-grid">
          {ENDING_LIST.map((ending) => {
            const unlocked = state.meta.endingsSeen.includes(ending.id);
            return (
              <div
                key={ending.id}
                className={`gallery-card ${unlocked ? 'gallery-card--open' : 'gallery-card--locked'}`}
              >
                <div className="gallery-card__id">{ending.id}</div>
                <div className="gallery-card__name">{unlocked ? ending.name : '？？？'}</div>
                <p className="gallery-card__desc">
                  {unlocked ? ending.description : '尚未抵达的落点。'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}