import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { ENDINGS } from '../../story/endings';
import { PixelButton } from '../ui/PixelButton';
import { EndingGallery } from './EndingGallery';
import '../../styles/screens.css';

/** 结局卡：endingId 由引擎按 GAMEPLAY_DESIGN §7.1 判定矩阵求值后进入此屏 */
export function EndingScreen() {
  const { state, backToTitle } = useGame();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const ending = state.endingId ? ENDINGS[state.endingId] : null;

  if (!ending) return null;

  return (
    <div className="ending-screen">
      <div className="ending-card pixel-panel">
        <div className="ending-card__label">回 声 落 定</div>
        <h2 className={`ending-card__name ending-card__name--${ending.tone}`}>{ending.name}</h2>
        <p className="ending-card__desc">{ending.description}</p>
        <div className="ending-card__actions">
          <PixelButton variant="ghost" onClick={() => setGalleryOpen(true)}>
            结局画廊
          </PixelButton>
          <PixelButton variant="accent" onClick={backToTitle}>
            回到标题
          </PixelButton>
        </div>
      </div>
      <EndingGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
