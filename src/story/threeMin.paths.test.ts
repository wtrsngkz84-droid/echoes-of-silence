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

  it('S1 四个自证选项各有独立后果节点并进入 S2', () => {
    const consequenceIds = new Set<string>();
    const consequenceTexts = new Set<string>();
    for (const optionId of ['S1-001-O1', 'S1-001-O2', 'S1-001-O3', 'S1-001-O4']) {
      const atChoice = runToChoice(startChapter(STORY_INDEX, '3min'));
      const after = chooseOption(atChoice, STORY_INDEX, optionId);
      const node = STORY_INDEX.nodes.get(after.currentNodeId);
      expect(node?.kind).toBe('narration');
      expect(node?.goto).toBe('S2-001');
      consequenceIds.add(node!.id);
      consequenceTexts.add(node!.text ?? '');
    }
    expect(consequenceIds.size).toBe(4);
    expect(consequenceTexts.size).toBe(4);
  });

  it('S2 每个非目标消息都有错误反馈', () => {
    const node = STORY_INDEX.nodes.get('S2-001');
    expect(node?.kind).toBe('crop');
    const crop = node?.crop;
    expect(crop).toBeTruthy();
    expect(crop!.headerNote).toBe('11/27 夜 · 予安的手机');
    const missing = crop!.messages
      .map((_, index) => index)
      .filter((index) => index !== crop!.targetIndex && !crop!.wrongFeedback[index]);
    expect(missing).toEqual([]);
    expect(Object.keys(crop!.wrongFeedback)).toHaveLength(crop!.messages.length - 1);
  });

  it('S3 输入框带场景说明，S4 主副标题不重复', () => {
    const s3 = STORY_INDEX.nodes.get('S3-001');
    expect(s3?.kind).toBe('composer');
    expect(s3?.composer?.sceneNote).toContain('陈屿侧');

    const s4 = STORY_INDEX.nodes.get('S4-001');
    expect(s4?.title).toBe('S4 · 小满的求助');
    for (const id of ['S1-001', 'S2-001', 'S3-001', 'S4-001', 'S4-002', 'S4-003']) {
      const node = STORY_INDEX.nodes.get(id);
      expect(node?.title).toBeTruthy();
      expect(node?.beat).toBeTruthy();
      expect(node?.title).not.toBe(node?.beat);
      expect(node?.title).not.toContain('求助向');
    }
  });
});