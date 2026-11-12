import { useGame } from '../../state/GameContext';
import { PixelButton } from '../ui/PixelButton';
import '../../styles/screens.css';

export function TitleScreen() {
  const { state, setScreen, continueRun } = useGame();

  return (
    <div className="title-screen">
      <h1 className="title-screen__logo">沉默的回声</h1>
      <div className="title-screen__sub">ECHOES OF SILENCE</div>
      <div className="title-screen__menu">
        <PixelButton variant="accent" onClick={() => setScreen('warning')}>
          开始游戏
        </PixelButton>
        <PixelButton disabled={!state.hasMainSave} onClick={continueRun}>
          继续游戏
        </PixelButton>
      </div>
      <div className="title-screen__foot">
        <span>
          <span className="badge">M0 竖切片</span> 本版本包含测试占位剧情，正式剧本随
          STORY_SCRIPT 交付
        </span>
        <span>同一周 · 三个视角 · 你的选择决定回声落点</span>
      </div>
    </div>
  );
}
