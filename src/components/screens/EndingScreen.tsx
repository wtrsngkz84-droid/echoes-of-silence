import { useGame } from '../../state/GameContext';
import { ENDINGS } from '../../story/endings';
import { PixelButton } from '../ui/PixelButton';
import '../../styles/screens.css';

/** 结局卡：endingId 由引擎按 STORY_FLOW §4.1 求值后进入此屏 */
export function EndingScreen() {
  const { state, backToTitle } = useGame();
  const ending = state.endingId ? ENDINGS[state.endingId] : null;
  const flags = state.run?.flags ?? {};

  if (!ending) return null;

  return (
    <div className="ending-screen">
      <div className="ending-card pixel-panel">
        <div className="ending-card__label">回 声 落 定</div>
        <h2 className={`ending-card__name ending-card__name--${ending.tone}`}>{ending.name}</h2>
        <p className="ending-card__desc">{ending.description}</p>
        <p className="ending-card__axes">
          【M0 演示 · 结局判定输入】S_early={String(Boolean(flags.S_early))} ·
          W_asked_early={String(Boolean(flags.W_asked_early))} · R_level={String(flags.R_level ?? 0)} ·
          W_asked_again={String(Boolean(flags.W_asked_again))} · S_late={String(Boolean(flags.S_late))}
        </p>
        <div className="ending-card__actions">
          <PixelButton variant="accent" onClick={backToTitle}>
            回到标题
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
