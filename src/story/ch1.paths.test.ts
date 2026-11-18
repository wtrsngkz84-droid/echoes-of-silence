import { describe, expect, it } from 'vitest';
import {
  advanceNode,
  chooseOption,
  playNextChatMessage,
  startChapter,
  visibleChatMessages,
  visibleOptions,
} from '../engine/engine';
import type { RunState } from '../engine/types';
import { STORY_INDEX } from './index';

function runToChoice(run: RunState): RunState {
  let current = run;
  for (let step = 0; step < 1000; step += 1) {
    const node = STORY_INDEX.nodes.get(current.currentNodeId);
    if (!node) throw new Error(`节点不存在：${current.currentNodeId}`);
    if (node.kind === 'summary') return current;
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
  throw new Error('剧情推进超过 1000 步');
}

function pick(run: RunState, optionId: string): RunState {
  return chooseOption(run, STORY_INDEX, optionId);
}

function play(path: string[]): RunState {
  let run = startChapter(STORY_INDEX, 'ch1');
  for (const optionId of path) {
    run = runToChoice(run);
    run = pick(run, optionId);
  }
  return runToChoice(run);
}

const COMMON_OPENING = ['C1-021-O1', 'C1-004-O1'];

describe('第一章四条章级路径（STORY_SCRIPT §3）', () => {
  it('路径一 默认·完整原文线 → v_xm_help=3', () => {
    const run = play([
      ...COMMON_OPENING,
      'C1-005-O1',
      'C1-055-O1',
      'C1-064-O1',
      'C1-072-O1',
      'C1-081-O2',
      'C1-090-O1',
      'C1-009-O1',
      'C1-009-O5',
      'C1-111-O1',
    ]);
    expect(run.flags).toMatchObject({
      v_xm_help: 3,
      v_xm_variant: 0,
      v_xm_stay: 0,
      v_xm_read_zhou: 1,
      v_mom_alert: 0,
      v_xm_openness: 1,
      v_xm_ask_cy: 1,
      v_did_mom: 1,
      v_did_teacher: 1,
    });
    expect(run.currentNodeId).toBe('C1-010');
  });

  it('路径二 沉默线 → v_xm_help=0，留群且不求助', () => {
    const run = play([
      ...COMMON_OPENING,
      'C1-005-O4',
      'C1-055-O2',
      'C1-064-O3',
      'C1-072-O2',
      'C1-081-O1',
      'C1-009-O4',
      'C1-111-O3',
      'C1-114-O3',
    ]);
    expect(run.flags).toMatchObject({
      v_xm_help: 0,
      v_xm_variant: 3,
      v_xm_stay: 1,
      v_mom_alert: 0,
      v_xm_openness: 0,
    });
    expect(run.flags.v_xm_ask_cy).toBeUndefined();
    expect(run.flags.v_did_teacher).toBeUndefined();
    expect(run.currentNodeId).toBe('C1-010');
  });

  it('路径三 反悔线 → 12/7 转身交证据，v_xm_help=2', () => {
    const run = play([
      ...COMMON_OPENING,
      'C1-005-O4',
      'C1-055-O2',
      'C1-064-O3',
      'C1-072-O2',
      'C1-081-O1',
      'C1-009-O4',
      'C1-111-O2',
    ]);
    expect(run.flags).toMatchObject({
      v_xm_help: 2,
      v_did_teacher: 1,
    });
    expect(run.flags.v_did_mom).toBeUndefined();
    expect(run.currentNodeId).toBe('C1-010');
  });

  it('路径四 私信对质线 → v_xm_variant=2', () => {
    const run = play([
      ...COMMON_OPENING,
      'C1-005-O3',
      'C1-055-O1',
      'C1-064-O1',
      'C1-072-O1',
      'C1-081-O2',
      'C1-090-O1',
      'C1-009-O1',
      'C1-009-O5',
      'C1-111-O1',
    ]);
    expect(run.flags).toMatchObject({
      v_xm_variant: 2,
      v_xm_help: 3,
    });
    expect(run.currentNodeId).toBe('C1-010');
  });

  it('12/5–12/6 办公室路径 → 提前求助 v_xm_help=2 且仍收 EV-06', () => {
    const run = play([
      ...COMMON_OPENING,
      'C1-005-O4',
      'C1-055-O1',
      'C1-064-O3',
      'C1-072-O2',
      'C1-081-O1',
      'C1-009-O8',
      'C1-111-O3',
      'C1-114-O3',
    ]);
    expect(run.flags).toMatchObject({
      v_xm_help: 2,
      v_did_teacher: 1,
    });
    expect(run.flags.v_did_mom).toBeUndefined();
    expect(run.clues).toContain('EV-06');
    expect(run.currentNodeId).toBe('C1-010');
  });
});
