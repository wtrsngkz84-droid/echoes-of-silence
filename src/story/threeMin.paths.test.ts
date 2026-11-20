import { describe, expect, it } from 'vitest';
import {
  advanceNode,
  chooseOption,
  playNextChatMessage,
  resolveComposer,
  startChapter,
  visibleChatMessages,
  visibleOptions,
} from '../engine/engine';
import { evaluateEndingWithPrefix } from '../engine/endings';
import type { RunState } from '../engine/types';
import { STORY_INDEX } from './index';

function runToChoice(run: RunState): RunState {
  let current = run;
  for (let step = 0; step < 500; step += 1) {
    const node = STORY_INDEX.nodes.get(current.currentNodeId);
    if (!node) throw new Error(`节点不存在：${current.currentNodeId}`);
    if (node.kind === 'ending' || node.kind === 'composer') return current;
    if (node.kind === 'chat') {
      const total = visibleChatMessages(current, node).length;
      if (current.chatPlayed < total) {
        current = playNextChatMessage(current);
        continue;
      }
    }
    if (visibleOptions(current, node).length > 0) return current;
    if (!node.goto) throw new Error(`节点 ${node.id} 无 goto`);
    current = advanceNode(current, STORY_INDEX);
  }
  throw new Error('3 分钟路径推进超过 500 步');
}

function play(path: string[], composerAction: 'send' | 'delete' = 'delete'): RunState {
  let run = startChapter(STORY_INDEX, '3min');
  for (const optionId of path) {
    run = runToChoice(run);
    const node = STORY_INDEX.nodes.get(run.currentNodeId);
    if (node?.kind === 'composer' && node.composer) {
      run = resolveComposer(
        run,
        STORY_INDEX,
        composerAction,
        node.composer.candidates[1] ?? '候选句',
      );
      run = runToChoice(run);
    }
    run = chooseOption(run, STORY_INDEX, optionId);
  }
  return runToChoice(run);
}

describe('FR-13 三分钟路径 S1–S5', () => {
  it('推荐默认线走通并命中结局（3min_ 变量）', () => {
    const run = play(
      ['S1-001-O1', 'S4-001-O1', 'S4-002-O1', 'S4-003-O1'],
      'send',
    );
    expect(run.chapter).toBe('3min');
    expect(run.currentNodeId).toBe('S5-001');
    expect(run.flags).toMatchObject({
      '3min_v_xm_help': 2,
      '3min_v_zy_duty': 2,
      '3min_v_cy_act': 3,
    });
    expect(evaluateEndingWithPrefix(run.flags, '3min_')).toBe('E5');
  });

  it('沉默线允许落到 E1', () => {
    const run = play(['S1-001-O4', 'S4-001-O2', 'S4-002-O2', 'S4-003-O3']);
    expect(run.flags).toMatchObject({
      '3min_v_xm_help': 0,
      '3min_v_zy_duty': 0,
      '3min_v_cy_act': 0,
    });
    expect(evaluateEndingWithPrefix(run.flags, '3min_')).toBe('E1');
  });

  it('S1 四个自证选项均可进入 S2', () => {
    for (const optionId of ['S1-001-O1', 'S1-001-O2', 'S1-001-O3', 'S1-001-O4']) {
      const run = play([optionId, 'S4-001-O1', 'S4-002-O1', 'S4-003-O1']);
      expect(run.currentNodeId).toBe('S5-001');
    }
  });
});