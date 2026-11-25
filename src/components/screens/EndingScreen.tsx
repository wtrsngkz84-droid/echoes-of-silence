import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { ENDINGS } from '../../story/endings';
import { PixelButton } from '../ui/PixelButton';
import { EndingGallery } from './EndingGallery';
import '../../styles/screens.css';

const ENDING_ART: Record<string, string> = {
  E1: 'e1.png',
  E2: 'e2.png',
  E3: 'e3.png',
  E4: 'e4.png',
  E5: 'e5.png',
};

/** 结局卡：endingId 由引擎按 GAMEPLAY_DESIGN §7.1 判定矩阵求值后进入此屏 */
export function EndingScreen() {
  const { state, backToTitle, startRun } = useGame();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [artFailed, setArtFailed] = useState(false);
  const ending = state.endingId ? ENDINGS[state.endingId] : null;
  const isThreeMin = state.run?.chapter === '3min';
  const artFile = ending ? ENDING_ART[ending.id] : undefined;
  const artSrc = artFile ? `${import.meta.env.BASE_URL}assets/endings/${artFile}` : undefined;

  if (!ending) return null;

  return (
    <div className="ending-screen">
      <div className="ending-card pixel-panel">
        {artSrc && !artFailed && (
          <div className="ending-card__art">
            <img src={artSrc} alt="" onError={() => setArtFailed(true)} />
          </div>
        )}
        <div className="ending-card__label">回 声 落 定</div>
        <h2 className={`ending-card__name ending-card__name--${ending.tone}`}>{ending.name}</h2>
        <p className="ending-card__desc">{ending.description}</p>
        {isThreeMin && (
          <div className="ending-card__short">
            <p>这是完整体验的十分之一。</p>
            <p>完整体验里，你还有十二天。</p>
          </div>
        )}
        <div className="ending-card__actions">
          {isThreeMin ? (
            <>
              <PixelButton
                variant="accent"
                onClick={() => {
                  if (state.hasSave) backToTitle();
                  else startRun('ch1');
                }}
              >
                进入完整体验
              </PixelButton>
              <PixelButton onClick={() => startRun('3min')}>重新选择 3 分钟</PixelButton>
              <PixelButton variant="ghost" onClick={backToTitle}>
                回到标题
              </PixelButton>
            </>
          ) : (
            <>
              <PixelButton variant="ghost" onClick={() => setGalleryOpen(true)}>
                结局画廊
              </PixelButton>
              <PixelButton variant="accent" onClick={backToTitle}>
                回到标题
              </PixelButton>
            </>
          )}
        </div>
      </div>
      <EndingGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
