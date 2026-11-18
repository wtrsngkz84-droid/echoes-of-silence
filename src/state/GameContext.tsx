import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import {
  advanceNode,
  canAdvance,
  chooseOption,
  completeChecklist,
  playNextChatMessage,
  startChapter,
  visibleChatMessages,
} from '../engine/engine';
import { evaluateEnding } from '../engine/endings';
import type {
  ChapterId,
  ClueDef,
  EndingId,
  ProgressMeta,
  RunState,
  ScreenId,
} from '../engine/types';
import { CLUES } from '../story/clues';
import { STORY_INDEX } from '../story/index';
import { clearRun, hasRun, loadMeta, loadRun, saveMeta, saveRun } from './save';

interface SessionState {
  screen: ScreenId;
  run: RunState | null;
  /** 新获得的线索（Toast 演出），确认后清除 */
  pendingClue: ClueDef | null;
  menuOpen: boolean;
  cluePanelOpen: boolean;
  endingId: EndingId | null;
  meta: ProgressMeta;
  hasSave: boolean;
}

type SessionAction =
  | { type: 'START_RUN'; chapter: ChapterId }
  | { type: 'CONTINUE_RUN'; run: RunState }
  | { type: 'ADVANCE' }
  | { type: 'CHOOSE'; optionId: string }
  | { type: 'CHAT_NEXT' }
  | { type: 'CHECKLIST_SUBMIT'; selectedIds: string[] }
  | { type: 'DELETE_MESSAGE'; text: string }
  | { type: 'SET_SCREEN'; screen: ScreenId }
  | { type: 'OPEN_MENU' }
  | { type: 'CLOSE_MENU' }
  | { type: 'OPEN_CLUES' }
  | { type: 'CLOSE_CLUES' }
  | { type: 'DISMISS_CLUE' }
  | { type: 'BACK_TO_TITLE' };

const initialState: SessionState = {
  screen: 'title',
  run: null,
  pendingClue: null,
  menuOpen: false,
  cluePanelOpen: false,
  endingId: null,
  meta: loadMeta(),
  hasSave: hasRun(),
};

interface RunTransition {
  run: RunState;
  screen: ScreenId;
  pendingClue: ClueDef | null;
  endingId: EndingId | null;
  meta: ProgressMeta;
}

/**
 * run 变化后的统一结算：线索 Toast、结局判定、图鉴记录。
 * prevRun 用于差分新线索（继续游戏时不重播 Toast）。
 */
function settleRun(prev: SessionState, prevRun: RunState | null, nextRun: RunState): RunTransition {
  const node = STORY_INDEX.nodes.get(nextRun.currentNodeId);

  let pendingClue: ClueDef | null = null;
  const newClues = nextRun.clues.filter((c) => !(prevRun?.clues ?? []).includes(c));
  if (newClues.length > 0 && CLUES[newClues[0]]) pendingClue = CLUES[newClues[0]];

  let meta = prev.meta;
  const clueLog = Array.from(new Set([...meta.clueLog, ...nextRun.clues]));
  if (clueLog.length !== meta.clueLog.length) meta = { ...meta, clueLog };

  let screen = prev.screen;
  let endingId = prev.endingId;
  if (node?.kind === 'ending') {
    endingId = evaluateEnding(nextRun.flags);
    screen = 'ending';
    if (!meta.endingsSeen.includes(endingId)) {
      meta = { ...meta, endingsSeen: [...meta.endingsSeen, endingId] };
    }
  } else {
    screen = 'game';
  }

  return { run: nextRun, screen, pendingClue, endingId, meta };
}

function persist(next: SessionState, prevRun: RunState | null): SessionState {
  if (!next.run) return next;
  const finished = STORY_INDEX.nodes.get(next.run.currentNodeId)?.kind === 'ending';
  if (finished) {
    // 通关即失效：单局存档仅在局中有效，避免「继续游戏」把已结束的一局拉回结局卡
    clearRun();
  } else if (!prevRun || next.run.currentNodeId !== prevRun.currentNodeId) {
    saveRun(next.run);
  }
  saveMeta(next.meta);
  return { ...next, hasSave: !finished };
}

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_RUN': {
      const run = startChapter(STORY_INDEX, action.chapter);
      const settled = settleRun(state, null, run);
      const next: SessionState = {
        ...state,
        ...settled,
        menuOpen: false,
        cluePanelOpen: false,
        hasSave: true,
      };
      return persist(next, null);
    }
    case 'CONTINUE_RUN': {
      const settled = settleRun(state, action.run, action.run);
      const next: SessionState = {
        ...state,
        ...settled,
        menuOpen: false,
        cluePanelOpen: false,
        hasSave: true,
      };
      return persist(next, action.run);
    }
    case 'ADVANCE': {
      if (!state.run) return state;
      const node = STORY_INDEX.nodes.get(state.run.currentNodeId);
      if (!node || !canAdvance(state.run, node)) return state;
      const settled = settleRun(state, state.run, advanceNode(state.run, STORY_INDEX));
      return persist({ ...state, ...settled }, state.run);
    }
    case 'CHOOSE': {
      if (!state.run) return state;
      const settled = settleRun(
        state,
        state.run,
        chooseOption(state.run, STORY_INDEX, action.optionId),
      );
      return persist({ ...state, ...settled }, state.run);
    }
    case 'CHAT_NEXT': {
      if (!state.run) return state;
      const node = STORY_INDEX.nodes.get(state.run.currentNodeId);
      if (!node || node.kind !== 'chat') return state;
      if (state.run.chatPlayed >= visibleChatMessages(state.run, node).length) return state;
      return { ...state, run: playNextChatMessage(state.run) };
    }
    case 'CHECKLIST_SUBMIT': {
      if (!state.run) return state;
      const settled = settleRun(
        state,
        state.run,
        completeChecklist(state.run, STORY_INDEX, action.selectedIds),
      );
      return persist({ ...state, ...settled }, state.run);
    }
    case 'DELETE_MESSAGE': {
      if (!state.run) return state;
      const nextRun: RunState = {
        ...state.run,
        deletedMessages: [...(state.run.deletedMessages ?? []), action.text],
      };
      saveRun(nextRun);
      return { ...state, run: nextRun };
    }
    case 'SET_SCREEN':
      return { ...state, screen: action.screen };
    case 'OPEN_MENU':
      return { ...state, menuOpen: true };
    case 'CLOSE_MENU':
      return { ...state, menuOpen: false };
    case 'OPEN_CLUES':
      return { ...state, cluePanelOpen: true };
    case 'CLOSE_CLUES':
      return { ...state, cluePanelOpen: false };
    case 'DISMISS_CLUE':
      return { ...state, pendingClue: null };
    case 'BACK_TO_TITLE':
      return { ...state, screen: 'title', menuOpen: false, cluePanelOpen: false };
    default:
      return state;
  }
}

interface GameContextValue {
  state: SessionState;
  startRun: (chapter: ChapterId) => void;
  continueRun: () => void;
  advance: () => void;
  choose: (optionId: string) => void;
  chatNext: () => void;
  submitChecklist: (selectedIds: string[]) => void;
  recordDeletedMessage: (text: string) => void;
  setScreen: (screen: ScreenId) => void;
  openMenu: () => void;
  closeMenu: () => void;
  openClues: () => void;
  closeClues: () => void;
  dismissClue: () => void;
  backToTitle: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      startRun: (chapter) => dispatch({ type: 'START_RUN', chapter }),
      continueRun: () => {
        const run = loadRun();
        if (run) dispatch({ type: 'CONTINUE_RUN', run });
      },
      advance: () => dispatch({ type: 'ADVANCE' }),
      choose: (optionId) => dispatch({ type: 'CHOOSE', optionId }),
      chatNext: () => dispatch({ type: 'CHAT_NEXT' }),
      submitChecklist: (selectedIds) => dispatch({ type: 'CHECKLIST_SUBMIT', selectedIds }),
      recordDeletedMessage: (text) => dispatch({ type: 'DELETE_MESSAGE', text }),
      setScreen: (screen) => dispatch({ type: 'SET_SCREEN', screen }),
      openMenu: () => dispatch({ type: 'OPEN_MENU' }),
      closeMenu: () => dispatch({ type: 'CLOSE_MENU' }),
      openClues: () => dispatch({ type: 'OPEN_CLUES' }),
      closeClues: () => dispatch({ type: 'CLOSE_CLUES' }),
      dismissClue: () => dispatch({ type: 'DISMISS_CLUE' }),
      backToTitle: () => dispatch({ type: 'BACK_TO_TITLE' }),
    }),
    [state],
  );

  useEffect(() => {
    document.title = '沉默的回声 · Echoes of Silence';
  }, []);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame 必须在 GameProvider 内使用');
  return ctx;
}
