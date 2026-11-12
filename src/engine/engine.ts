import { applyFlags, testCondition } from './conditions';
import type {
  ChapterId,
  ChatMessage,
  RunState,
  StoryIndex,
  StoryNode,
  StoryOption,
} from './types';

export function buildStoryIndex(
  nodes: StoryNode[],
  chapterStarts: Partial<Record<ChapterId, string>>,
): StoryIndex {
  const map = new Map<string, StoryNode>();
  for (const node of nodes) map.set(node.id, node);
  return { nodes: map, chapterStarts };
}

export function getNode(index: StoryIndex, nodeId: string): StoryNode {
  const node = index.nodes.get(nodeId);
  if (!node) throw new Error(`剧情节点不存在：${nodeId}`);
  return node;
}

export function startChapter(index: StoryIndex, chapter: ChapterId, isEcho: boolean): RunState {
  const startId = index.chapterStarts[chapter];
  if (!startId) throw new Error(`章节 ${chapter} 尚未注册起始节点`);
  const base: RunState = {
    runId: `${isEcho ? 'echo' : 'main'}-${Date.now().toString(36)}`,
    chapter,
    currentNodeId: startId,
    flags: {},
    chatPlayed: 0,
    clues: [],
    visitedNodes: [],
    isEcho,
  };
  return enterNode(base, index, startId);
}

/**
 * 进入节点：应用 effects、收集线索、重置聊天进度、记录访问。
 * 同一节点重复进入不重复收集线索、不重复追加访问记录。
 */
export function enterNode(run: RunState, index: StoryIndex, nodeId: string): RunState {
  const node = getNode(index, nodeId);
  const flags = applyFlags(run.flags, node.effects);

  let clues = run.clues;
  if (node.clueId && !run.clues.includes(node.clueId)) {
    clues = [...run.clues, node.clueId];
  }

  const visited = run.visitedNodes.includes(nodeId)
    ? run.visitedNodes
    : [...run.visitedNodes, nodeId];

  return {
    ...run,
    currentNodeId: nodeId,
    flags,
    clues,
    visitedNodes: visited,
    chatPlayed: 0,
  };
}

/** 无选项节点推进（点击对话/播放完聊天后）。缺 goto 为数据错误，由 validation 拦截。 */
export function advanceNode(run: RunState, index: StoryIndex): RunState {
  const node = getNode(index, run.currentNodeId);
  if (!node.goto) throw new Error(`节点 ${node.id} 无 goto，无法推进`);
  return enterNode(run, index, node.goto);
}

export function chooseOption(run: RunState, index: StoryIndex, optionId: string): RunState {
  const node = getNode(index, run.currentNodeId);
  const option = node.options?.find((o) => o.id === optionId);
  if (!option) throw new Error(`选项不存在：${optionId}（节点 ${node.id}）`);
  if (!optionVisible(run, option)) {
    throw new Error(`选项条件不满足：${optionId}（节点 ${node.id}）`);
  }
  const chosen: RunState = { ...run, flags: applyFlags(run.flags, option.effects) };
  return enterNode(chosen, index, option.goto);
}

function optionVisible(run: RunState, option: StoryOption): boolean {
  return testCondition(run, option.requires);
}

/** 当前节点满足显示条件的选项 */
export function visibleOptions(run: RunState, node: StoryNode): StoryOption[] {
  return (node.options ?? []).filter((o) => optionVisible(run, o));
}

/** 聊天节点中满足条件的消息（条件求值一次，演出期间 flag 不变） */
export function visibleChatMessages(run: RunState, node: StoryNode): ChatMessage[] {
  return (node.messages ?? []).filter((m) => testCondition(run, m.requires));
}

/** 播放聊天演出中的下一条消息 */
export function playNextChatMessage(run: RunState): RunState {
  return { ...run, chatPlayed: run.chatPlayed + 1 };
}

export function chatFinished(run: RunState, node: StoryNode): boolean {
  return run.chatPlayed >= visibleChatMessages(run, node).length;
}

export function hasOptions(run: RunState, node: StoryNode): boolean {
  return visibleOptions(run, node).length > 0;
}

/** 该节点是否可推进（无选项的对话/旁白/聊天） */
export function canAdvance(run: RunState, node: StoryNode): boolean {
  if (node.kind === 'chat') return chatFinished(run, node);
  return !hasOptions(run, node) && Boolean(node.goto);
}
