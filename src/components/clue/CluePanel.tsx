import { useGame } from '../../state/GameContext';
import { CLUES } from '../../story/clues';
import { PixelButton } from '../ui/PixelButton';
import '../../styles/game.css';

/** 线索面板：本局收集的线索（全局图鉴按 STORY_FLOW §5 跨局共享，M2 扩展） */
export function CluePanel() {
  const { state, closeClues } = useGame();
  if (!state.cluePanelOpen) return null;

  const collected = (state.run?.clues ?? []).map((id) => CLUES[id]).filter(Boolean);

  return (
    <div className="clue-panel" role="dialog" aria-label="线索面板">
      <div className="clue-panel__inner pixel-panel">
        <h2>线索 · {collected.length}</h2>
        {collected.length === 0 ? (
          <p className="clue-empty">还没有收集到线索。</p>
        ) : (
          collected.map((clue) => (
            <div key={clue.id} className="clue-item">
              <div className="clue-item__head">
                <span className="clue-item__name">{clue.name}</span>
                <span className="clue-item__fact">{clue.factRef}</span>
              </div>
              <p className="clue-item__desc">{clue.description}</p>
            </div>
          ))
        )}
        <PixelButton onClick={closeClues}>关闭 [Esc]</PixelButton>
      </div>
    </div>
  );
}
