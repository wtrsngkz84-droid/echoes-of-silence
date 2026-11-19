import { describe, expect, it } from 'vitest';
import {
  advanceNode,
  chooseOption,
  playNextChatMessage,
  resolveComposer,
  solveReasoning,
  startChapter,
  visibleChatMessages,
  visibleOptions,
} from '../engine/engine';
import type { Flags, RunState } from '../engine/types';
import { STORY_INDEX } from './index';

function runToChoice(run: RunState): RunState {
  let current = run;
  for (let step = 0; step < 2000; step += 1) {
    const node = STORY_INDEX.nodes.get(current.currentNodeId);
    if (!node) throw new Error(`节点不存在：${current.currentNodeId}`);
    if (
      node.kind === 'summary' ||
      node.kind === 'checklist' ||
      node.kind === 'composer' ||
      node.kind === 'ending'
    ) {
      return current;
    }
    if (node.kind === 'reasoning') {
      current = solveReasoning(current, STORY_INDEX);
      continue;
    }
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
  throw new Error('剧情推进超过 2000 步');
}

function pick(run: RunState, optionId: string): RunState {
  return chooseOption(run, STORY_INDEX, optionId);
}

function play(
  path: string[],
  composerAction: 'send' | 'delete' = 'delete',
  seed: Flags = {},
): RunState {
  let run = startChapter(STORY_INDEX, 'ch3');
  run = { ...run, flags: { ...run.flags, ...seed } };

  for (const optionId of path) {
    run = runToChoice(run);
    const node = STORY_INDEX.nodes.get(run.currentNodeId);
    if (node?.kind === 'composer' && node.composer) {
      const text = node.composer.candidates[1] ?? '候选句';
      run = resolveComposer(run, STORY_INDEX, composerAction, text);
      run = runToChoice(run);
    }
    run = pick(run, optionId);
  }
  return runToChoice(run);
}

describe('第三章四条章级路径（STORY_SCRIPT §14）', () => {
  it('路径一 沉默线 → early=0、echo=0、reveal=0、act=0', () => {
    const run = play([
      'C3-013-O2',
      'C3-003-O1',
      'C3-034-O1',
      'C3-041-O1',
      'C3-051-O2',
      'C3-055-O2',
      'C3-006-O1',
    ]);
    expect(run.flags).toMatchObject({
      v_cy_early: 0,
      v_cy_echo: 0,
      v_cy_reveal: 0,
      v_cy_act: 0,
    });
    expect(run.currentNodeId).toBe('C3-008');
  });

  it('路径二 跟风线 → echo=1 且 act=0', () => {
    const run = play([
      'C3-013-O2',
      'C3-003-O2',
      'C3-034-O1',
      'C3-041-O1',
      'C3-051-O2',
      'C3-055-O2',
      'C3-006-O1',
    ]);
    expect(run.flags).toMatchObject({ v_cy_echo: 1, v_cy_act: 0 });
    expect(run.currentNodeId).toBe('C3-008');
  });

  it('路径三 私援线 → reveal≥1、trust=2、act=1、EV-08 持有', () => {
    const run = play([
      'C3-013-O2',
      'C3-003-O1',
      'C3-034-O1',
      'C3-041-O2',
      'C3-051-O1',
      'C3-055-O1',
      'C3-006-O2',
    ]);
    expect(run.flags).toMatchObject({
      v_cy_reveal: 1,
      v_cy_trust: 2,
      v_cy_act: 1,
      v_did_ident: 1,
      v_did_told: 1,
    });
    expect(run.clues).toContain('EV-08');
    expect(run.currentNodeId).toBe('C3-008');
  });

  it('路径四 公开线 → early=1、act=3', () => {
    const run = play(
      [
        'C3-013-O2',
        'C3-003-O1',
        'C3-034-O1',
        'C3-041-O4',
        'C3-051-O1',
        'C3-055-O1',
        'C3-006-O5',
      ],
      'send',
    );
    expect(run.flags).toMatchObject({ v_cy_early: 1, v_cy_act: 3 });
    expect(run.currentNodeId).toBe('C3-008');
  });

  it('兑现线 → Ch1 请求 + Ch3 答应 + 交证据', () => {
    const run = play(
      [
        'C3-013-O2',
        'C3-003-O1',
        'C3-034-O1',
        'C3-041-O2',
        'C3-046-O1',
        'C3-051-O1',
        'C3-055-O1',
        'C3-006-O4',
      ],
      'delete',
      { v_xm_ask_cy: 1 },
    );
    expect(run.flags).toMatchObject({
      v_did_pledge: 1,
      v_cy_act: 2,
    });
    expect(run.currentNodeId).toBe('C3-008');
  });

  it('删除分支把文本写入 deletedMessages', () => {
    const run = play(
      ['C3-013-O2', 'C3-003-O1', 'C3-034-O1', 'C3-041-O1', 'C3-051-O2', 'C3-055-O2', 'C3-006-O1'],
      'delete',
    );
    expect(run.deletedMessages?.length).toBe(1);
  });
});