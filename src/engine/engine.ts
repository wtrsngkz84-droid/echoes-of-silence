import { applyFlags, testCondition } from './conditions';
import type {
  ChapterId,
  ChatMessage,
  Condition,
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

export function startChapter(index: StoryIndex, chapter: ChapterId): RunState {
  const startId = index.chapterStarts[chapter];
  if (!startId) throw new Error(`章节 ${chapter} 尚未注册起始节点`);
  const base: RunState = {
    runId: `run-${Date.now().toString(36)}`,
    chapter,
    currentNodeId: startId,
    flags: {},
    chatPlayed: 0,
    clues: [],
    visitedNodes: [],
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

/** 推理面板当前可见线索（含条件线索）。 */
export function visibleReasoningClues(
  run: RunState,
  content: { clues: string[]; conditionalClues?: { text: string; requires?: Condition }[] },
): string[] {
  const conditional = (content.conditionalClues ?? [])
    .filter((clue) => testCondition(run, clue.requires))
    .map((clue) => clue.text);
  return [...content.clues, ...conditional];
}

/** 推理指认正确：写入 solvedEffects 并进入后继节点。 */
export function solveReasoning(run: RunState, index: StoryIndex): RunState {
  const node = getNode(index, run.currentNodeId);
  if (node.kind !== 'reasoning' || !node.reasoning || !node.goto) {
    throw new Error(`节点 ${node.id} 不是可结算的推理节点`);
  }
  const flags = applyFlags(run.flags, node.reasoning.solvedEffects);
  return enterNode({ ...run, flags }, index, node.goto);
}

/** 担责清单提交：全选 duty=2，任一放弃 duty=1；至少选择一项。 */
export function completeChecklist(
  run: RunState,
  index: StoryIndex,
  selectedIds: string[],
): RunState {
  const node = getNode(index, run.currentNodeId);
  if (node.kind !== 'checklist' || !node.checklist || !node.goto) {
    throw new Error(`节点 ${node.id} 不是可提交的担责清单`);
  }
  const selected = new Set(selectedIds);
  if (!node.checklist.items.some((item) => selected.has(item.id))) {
    throw new Error(`担责清单至少选择一项（节点 ${node.id}）`);
  }
  const all = node.checklist.items.every((item) => selected.has(item.id));
  const effects = all
    ? (node.checklist.fullEffects ?? { v_zy_duty: 2 })
    : (node.checklist.partialEffects ?? { v_zy_duty: 1 });
  const flags = applyFlags(run.flags, { ...effects, v_did_self: 1 });
  return enterNode({ ...run, flags }, index, node.goto);
}

/** 输入框发送/删除：效果由节点数据定义；删除的文本写入 deletedMessages。 */
export function resolveComposer(
  run: RunState,
  index: StoryIndex,
  action: 'send' | 'delete',
  text: string,
): RunState {
  const node = getNode(index, run.currentNodeId);
  if (node.kind !== 'composer' || !node.composer || !node.goto) {
    throw new Error(`节点 ${node.id} 不是可提交的输入框`);
  }
  const effects =
    action === 'send' ? node.composer.sendEffects : node.composer.deleteEffects;
  const flags = applyFlags(run.flags, effects);
  const deletedMessages =
    action === 'delete'
      ? [...(run.deletedMessages ?? []), text]
      : run.deletedMessages;
  return enterNode(
    { ...run, flags, deletedMessages },
    index,
    node.goto,
  );
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

/** 当前节点实际显示文本：首个满足条件的变体优先，否则用 text。 */
export function visibleNodeText(run: RunState, node: StoryNode): string {
  for (const variant of node.variants ?? []) {
    if (testCondition(run, variant.requires)) return variant.text;
  }
  return node.text ?? '';
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

/** 当前是否处于自动上涌段（含暂停态）：用于阻止点击跳过首遍。 */
export function autoFloodActive(run: RunState, node: StoryNode): boolean {
  if (!node.autoFlood || node.kind !== 'chat') return false;
  const from = Math.max(0, Math.floor(node.floodFrom ?? 0));
  return run.chatPlayed >= from && !chatFinished(run, node);
}

export function hasOptions(run: RunState, node: StoryNode): boolean {
  return visibleOptions(run, node).length > 0;
}

/** 该节点是否可推进（无选项的对话/旁白/聊天） */
export function canAdvance(run: RunState, node: StoryNode): boolean {
  if (node.kind === 'chat') return chatFinished(run, node);
  return !hasOptions(run, node) && Boolean(node.goto);
}
