import { useState } from 'react';
import { useGame } from '../../state/GameContext';
import { PixelButton } from '../ui/PixelButton';
import { Sketchbook, type SketchPage } from './Sketchbook';
import '../../styles/game.css';

/** 暂停菜单：继续 / 线索 / 速写本（ch3） / 返回标题（自动存档） */
export function GameMenu() {
  const { state, closeMenu, openClues, backToTitle } = useGame();
  const [sketchbookOpen, setSketchbookOpen] = useState(false);
  const run = state.run;
  const pages: SketchPage[] = [];
  if (run?.chapter === 'ch3') {
    if (run.visitedNodes.includes('C3-001')) {
      pages.push({ id: 'p1126', date: '11/26', note: '汇报课。椅子的第一页还没有画。' });
    }
    if (run.visitedNodes.includes('C3-033')) {
      pages.push({ id: 'p1130', date: '11/30', note: '空座位。画了一把空椅子。' });
    }
    if (run.visitedNodes.includes('C3-034')) {
      pages.push({ id: 'p1202', date: '12/2', note: '捡起本子。椅子旁边多了几笔。' });
    }
    if (run.visitedNodes.includes('C3-004')) {
      pages.push({ id: 'p1204', date: '12/4', note: '她说了话。' });
    }
    if (run.visitedNodes.includes('C3-005')) {
      pages.push({ id: 'p1207', date: '12/7', note: '公示。' });
    }
    if (run.visitedNodes.includes('C3-007')) {
      pages.push({ id: 'p1214', date: '12/14', note: '班会。最后一页。' });
    }
  }
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
        pages={pages}
        deletedMessages={state.run?.deletedMessages ?? []}
        onClose={() => setSketchbookOpen(false)}
      />
    </div>
  );
}
