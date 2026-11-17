import { JUDGEMENT_VARS } from '../../engine/endings';
import { useGame } from '../../state/GameContext';
import { ENDINGS } from '../../story/endings';
import { PixelButton } from '../ui/PixelButton';
import '../../styles/screens.css';

/** 结局卡：endingId 由引擎按 GAMEPLAY_DESIGN §7.1 判定矩阵求值后进入此屏 */
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
        {import.meta.env.DEV && (
          <p className="ending-card__axes">
            【开发演示 · 判定矩阵输入】
            {JUDGEMENT_VARS.map((v) => `${v.label} ${Number(flags[v.key] ?? 0)}`).join(' · ')}
            （判定顺序 E5→E4→E3→E1→E2）
          </p>
        )}
        <div className="ending-card__actions">
          <PixelButton variant="accent" onClick={backToTitle}>
            回到标题
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
