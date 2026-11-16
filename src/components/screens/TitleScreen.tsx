import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { PixelButton } from '../ui/PixelButton';
import '../../styles/screens.css';

export function TitleScreen() {
  const { state, setScreen, continueRun } = useGame();
  const [confirmNew, setConfirmNew] = useState(false);

  const startNew = () => {
    if (state.hasSave) {
      setConfirmNew(true);
      return;
    }
    setScreen('warning');
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
      </div>
      <div className="title-screen__foot">
        <span>
          <span className="badge">第一章 · 正式剧本</span> 第 2/3 章制作中，C1-901 为演示网关
        </span>
        <span>同一周 · 三个视角 · 你的选择决定回声落点</span>
      </div>

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
                  setScreen('warning');
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
