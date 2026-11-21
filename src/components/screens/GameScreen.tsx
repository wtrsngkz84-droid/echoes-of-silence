import { useEffect, useMemo, useState } from 'react';
import {
  autoFloodActive,
  canAdvance,
  visibleChatMessages,
  visibleNodeText,
  visibleOptions,
  visibleReasoningClues,
} from '../../engine/engine';
import type { ChapterId, ScreenshotContent } from '../../engine/types';
import { useGameKeyboard } from '../../hooks/useKeyboard';
import { useTypewriter } from '../../hooks/useTypewriter';
import { useGame } from '../../state/GameContext';
import { CHARACTERS } from '../../story/characters';
import { STORY_INDEX } from '../../story/index';
import { CropNight } from '../chat/CropNight';
import { PhoneCall } from '../chat/PhoneCall';
import { PhoneChat } from '../chat/PhoneChat';
import { ScreenshotViewer } from '../chat/ScreenshotViewer';
import { ChoiceList } from '../dialogue/ChoiceList';
import { DialogueBox } from '../dialogue/DialogueBox';
import { DutyChecklist } from '../dialogue/DutyChecklist';
import { MessageComposer } from '../chat/MessageComposer';
import { ReasoningPanel } from '../dialogue/ReasoningPanel';
import { TypingDelete } from '../dialogue/TypingDelete';
import { ChapterSummary } from './ChapterSummary';
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
  '3min': '3 分钟体验',
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

  const nodeText = run && node ? visibleNodeText(run, node) : '';
  const typer = useTypewriter(nodeText);
  const [viewerContent, setViewerContent] = useState<ScreenshotContent | null>(null);
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    setViewerContent(null);
    setTypingDone(false);
  }, [run?.currentNodeId]);

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

  const overlayBlocked = state.menuOpen || state.cluePanelOpen || viewerContent !== null;

  const primary = () => {
    if (!run || !node || overlayBlocked) return;
    if (node.kind === 'chat') {
      // 自动上涌段（含暂停态）不接受点击跳过；暂停/加速由聊天窗控件处理。
      if (autoFloodActive(run, node)) return;
      if (run.chatPlayed < chatTotal) {
        game.chatNext();
      } else if (options.length === 0 && canAdvance(run, node)) {
        game.advance();
      }
      return;
    }
    if (node.kind === 'typing') {
      if (!typingDone) return;
      if (options.length === 0 && canAdvance(run, node)) {
        game.advance();
      }
      return;
    }
    if (node.kind === 'summary') {
      if (options.length === 0 && canAdvance(run, node)) {
        game.advance();
      }
      return;
    }
    if (
      node.kind === 'crop' ||
      node.kind === 'reasoning' ||
      node.kind === 'checklist' ||
      node.kind === 'composer'
    ) {
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
    if (viewerContent) return;
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
      data-node-id={node.id}
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
        <PhoneChat
          run={run}
          node={node}
          onChatNext={game.chatNext}
          onOpenScreenshot={setViewerContent}
        />
      ) : node.kind === 'composer' && node.composer ? (
        <MessageComposer
          candidates={node.composer.candidates}
          onSend={(text) => game.resolveComposer('send', text)}
          onDelete={(text) => game.resolveComposer('delete', text)}
        />
      ) : node.kind === 'call' && node.call ? (
        <PhoneCall call={node.call} />
      ) : node.kind === 'crop' && node.crop ? (
        <CropNight content={node.crop} onComplete={game.advance} />
      ) : node.kind === 'reasoning' && node.reasoning ? (
        <ReasoningPanel
          content={node.reasoning}
          clues={visibleReasoningClues(run, node.reasoning)}
          onSolved={game.solveReasoning}
        />
      ) : node.kind === 'checklist' && node.checklist ? (
        <DutyChecklist content={node.checklist} onSubmit={game.submitChecklist} />
      ) : node.kind === 'typing' && node.typing ? (
        <TypingDelete effect={node.typing} onDone={() => setTypingDone(true)} />
      ) : node.kind === 'summary' ? (
        <ChapterSummary run={run} onContinue={game.advance} />
      ) : (
        <DialogueBox
          speaker={node.speaker}
          isInner={node.kind === 'inner'}
          text={typer.shownText}
          showHint={typer.done && options.length === 0 && canAdvance(run, node)}
        />
      )}

      {showChoices && <ChoiceList options={options} onSelect={game.choose} />}

      {viewerContent && (
        <ScreenshotViewer content={viewerContent} onClose={() => setViewerContent(null)} />
      )}

      <ClueToast />
      <CluePanel />
      <GameMenu />
    </div>
  );
}
