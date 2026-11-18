import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { PixelButton } from '../ui/PixelButton';
import { Sketchbook } from './Sketchbook';
import '../../styles/game.css';

/** 暂停菜单：继续 / 线索 / 速写本（ch3） / 返回标题（自动存档） */
export function GameMenu() {
  const { state, closeMenu, openClues, backToTitle } = useGame();
  const [sketchbookOpen, setSketchbookOpen] = useState(false);
  if (!state.menuOpen) return null;

  return (
    <div className="menu-overlay" role="dialog" aria-label="菜单">
      <div className="menu-overlay__inner">
        <PixelButton variant="accent" onClick={closeMenu}>
          继续故事
        </PixelButton>
        <PixelButton
          onClick={() => {
            closeMenu();
            openClues();
          }}
        >
          查看线索
        </PixelButton>
        {state.run?.chapter === 'ch3' && (
          <PixelButton onClick={() => setSketchbookOpen(true)}>速写本</PixelButton>
        )}
        <PixelButton onClick={backToTitle}>保存并返回标题</PixelButton>
        <p className="menu-overlay__note">进度已自动保存到本机</p>
      </div>
      <Sketchbook
        open={sketchbookOpen}
        pages={[]}
        deletedMessages={state.run?.deletedMessages ?? []}
        onClose={() => setSketchbookOpen(false)}
      />
    </div>
  );
}
