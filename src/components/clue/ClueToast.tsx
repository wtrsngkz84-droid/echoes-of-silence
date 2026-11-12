import { useEffect } from 'react';
import type { ClueDef } from '../../engine/types';
import { useGame } from '../../state/GameContext';
import '../../styles/game.css';

/** 新线索 Toast：显示 2.8 秒后自动消失，点击立即关闭 */
export function ClueToast() {
  const { state, dismissClue, openClues } = useGame();
  const clue: ClueDef | null = state.pendingClue;

  useEffect(() => {
    if (!clue) return;
    const timer = window.setTimeout(dismissClue, 2800);
    return () => window.clearTimeout(timer);
  }, [clue, dismissClue]);

  if (!clue) return null;

  return (
    <div
      className="clue-toast"
      onClick={() => {
        dismissClue();
        openClues();
      }}
      role="status"
    >
      <span className="clue-toast__icon">?</span>
      <span>
        <span className="clue-toast__label">获得线索</span>
        <br />
        <span className="clue-toast__name">{clue.name}</span>
      </span>
    </div>
  );
}
