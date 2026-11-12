import { useEffect, useMemo } from 'react';
import { canAdvance, visibleChatMessages, visibleOptions } from '../../engine/engine';
import type { ChapterId } from '../../engine/types';
import { useGameKeyboard } from '../../hooks/useKeyboard';
import { useTypewriter } from '../../hooks/useTypewriter';
import { useGame } from '../../state/GameContext';
import { CHARACTERS } from '../../story/characters';
import { STORY_INDEX } from '../../story/index';
import { PhoneChat } from '../chat/PhoneChat';
import { ChoiceList } from '../dialogue/ChoiceList';
import { DialogueBox } from '../dialogue/DialogueBox';
import { CluePanel } from '../clue/CluePanel';
import { ClueToast } from '../clue/ClueToast';
import { GameMenu } from '../menu/GameMenu';
import { PixelAvatar } from '../stage/PixelAvatar';
import { SceneBackground } from '../stage/SceneBackground';
import '../../styles/game.css';

const CHAPTER_NAMES: Record<ChapterId, string> = {
  ch1: '第1章 · 空出来的座位',
  ch2: '第2章 · 失控的群聊',
  ch3: '第3章 · 沉默的旁观者',
  epilogue: '尾声 · 回声',
};

export function GameScreen() {
  const game = useGame();
  const { state } = game;
  const run = state.run;
  const node = useMemo(
    () => (run ? STORY_INDEX.nodes.get(run.currentNodeId) ?? null : null),
    [run?.currentNodeId],
  );

  const typer = useTypewriter(node?.text ?? '');

  const options = useMemo(() => (run && node ? visibleOptions(run, node) : []), [run, node]);
  const chatTotal = useMemo(
    () => (run && node && node.kind === 'chat' ? visibleChatMessages(run, node).length : 0),
    [run, node],
  );
  const showChoices =
    run !== null &&
    node !== null &&
    options.length > 0 &&
    (node.kind !== 'chat' || run.chatPlayed >= chatTotal);
  const portrait = node?.speaker ? CHARACTERS[node.speaker] : undefined;

  const overlayBlocked = state.menuOpen || state.cluePanelOpen;

  const primary = () => {
    if (!run || !node || overlayBlocked) return;
    if (node.kind === 'chat') {
      if (run.chatPlayed < chatTotal) {
        game.chatNext();
      } else if (options.length === 0 && canAdvance(run, node)) {
        game.advance();
      }
      return;
    }
    if (!typer.done) {
      typer.skip();
      return;
    }
    if (options.length === 0 && canAdvance(run, node)) {
      game.advance();
    }
  };

  const escape = () => {
    if (state.cluePanelOpen) game.closeClues();
    else if (state.menuOpen) game.closeMenu();
    else if (run) game.openMenu();
  };

  useGameKeyboard(primary, escape);

  // 数字键选择选项
  useEffect(() => {
    if (options.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      const index = Number(e.key);
      if (Number.isInteger(index) && index >= 1 && index <= options.length) {
        e.preventDefault();
        game.choose(options[index - 1].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options, game]);

  if (!run || !node) return null;

  return (
    <div
      className="game-root"
      data-tone={node.tone ?? 'neutral'}
      onClick={primary}
      role="presentation"
    >
      <SceneBackground scene={node.scene} />
      <div className="tone-overlay" />

      {node.title && (
        <div className="scene-title">
          <div className="scene-title__main">{node.title}</div>
          {node.beat && <div className="scene-title__sub">{node.beat}</div>}
        </div>
      )}

      <header className="game-topbar">
        <div className="game-topbar__title">
          <span>{CHAPTER_NAMES[run.chapter]}</span>
          {node.isPlaceholder && <span className="badge">测试占位剧情</span>}
        </div>
        <div className="game-topbar__actions">
          <button
            className="topbar-btn"
            onClick={(e) => {
              e.stopPropagation();
              game.openClues();
            }}
          >
            线索 {run.clues.length}
          </button>
          <button
            className="topbar-btn"
            onClick={(e) => {
              e.stopPropagation();
              game.openMenu();
            }}
          >
            菜单
          </button>
        </div>
      </header>

      {portrait && node.kind !== 'chat' && (
        <div className="stage-portrait">
          <PixelAvatar character={portrait} size={128} />
        </div>
      )}

      {node.kind === 'chat' ? (
        <PhoneChat run={run} node={node} />
      ) : (
        <DialogueBox
          speaker={node.speaker}
          isInner={node.kind === 'inner'}
          text={typer.shownText}
          showHint={typer.done && options.length === 0 && canAdvance(run, node)}
        />
      )}

      {showChoices && <ChoiceList options={options} onSelect={game.choose} />}

      <ClueToast />
      <CluePanel />
      <GameMenu />
    </div>
  );
}
