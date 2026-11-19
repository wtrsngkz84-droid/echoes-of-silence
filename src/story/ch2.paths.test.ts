import { describe, expect, it } from 'vitest';
import {
  advanceNode,
  chooseOption,
  completeChecklist,
  playNextChatMessage,
  solveReasoning,
  startChapter,
  visibleChatMessages,
  visibleOptions,
} from '../engine/engine';
import type { RunState } from '../engine/types';
import { STORY_INDEX } from './index';

function runToChoice(run: RunState): RunState {
  let current = run;
  for (let step = 0; step < 1500; step += 1) {
    const node = STORY_INDEX.nodes.get(current.currentNodeId);
    if (!node) throw new Error(`节点不存在：${current.currentNodeId}`);
    if (node.kind === 'summary' || node.kind === 'checklist') return current;
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
  throw new Error('剧情推进超过 1500 步');
}

function pick(run: RunState, optionId: string): RunState {
  return chooseOption(run, STORY_INDEX, optionId);
}

function play(path: string[]): RunState {
  let run = startChapter(STORY_INDEX, 'ch2');
  for (const optionId of path) {
    run = runToChoice(run);
    run = pick(run, optionId);
  }
  return runToChoice(run);
}

function submitAll(run: RunState): RunState {
  const node = STORY_INDEX.nodes.get(run.currentNodeId);
  if (!node?.checklist) throw new Error('当前不是担责清单');
  return completeChecklist(run, STORY_INDEX, node.checklist.items.map((item) => item.id));
}

const OPENING = ['C2-011-O2', 'C2-002-O1', 'C2-003-O2'];

describe('第二章四条章级路径（STORY_SCRIPT §9）', () => {
  it('路径一 默认·担责线 → duty=2，六项全选', () => {
    let run = play([
      'C2-011-O2',
      'C2-002-O1',
      'C2-003-O3',
      'C2-005-O1',
      'C2-006-O1',
      'C2-064-O1',
      'C2-067-O1',
      'C2-070-O1',
      'C2-007-O2',
      'C2-008-O2',
      'C2-081-O1',
      'C2-081-O2',
      'C2-081-O4',
    ]);
    expect(run.currentNodeId).toBe('C2-086');
    run = submitAll(run);
    run = runToChoice(run);
    expect(run.flags).toMatchObject({
      v_zy_wound: 2,
      v_zy_compound: 2,
      v_zy_meme_stance: 0,
      v_zy_ask_note: 1,
      v_zy_ask_post: 1,
      v_zy_duty: 2,
    });
    expect(run.currentNodeId).toBe('C2-009');
  });

  it('路径二 加码线 → duty=-1', () => {
    const run = play([
      'C2-011-O1',
      'C2-002-O1',
      'C2-003-O2',
      'C2-005-O3',
      'C2-006-O3',
      'C2-064-O2',
      'C2-067-O2',
      'C2-070-O2',
      'C2-007-O1',
      'C2-008-O1',
      'C2-081-O5',
      'C2-089-O1',
    ]);
    expect(run.flags).toMatchObject({
      v_zy_wound: 1,
      v_zy_compound: 1,
      v_zy_meme_stance: 2,
      v_zy_ask_note: 0,
      v_zy_ask_post: 0,
      v_zy_duty: -1,
    });
    expect(run.currentNodeId).toBe('C2-009');
  });

  it('路径三 冷处理线 → duty=0', () => {
    const run = play([
      'C2-011-O3',
      'C2-002-O2',
      'C2-003-O1',
      'C2-005-O1',
      'C2-006-O2',
      'C2-064-O3',
      'C2-067-O2',
      'C2-070-O2',
      'C2-007-O1',
      'C2-008-O2',
      'C2-081-O5',
      'C2-089-O2',
    ]);
    expect(run.flags).toMatchObject({
      v_zy_wound: 0,
      v_zy_compound: 0,
      v_zy_meme_stance: 1,
      v_zy_duty: 0,
    });
    expect(run.currentNodeId).toBe('C2-009');
  });

  it('路径四 动摇线 → duty=+1', () => {
    const run = play([
      ...OPENING,
      'C2-005-O1',
      'C2-006-O2',
      'C2-064-O1',
      'C2-067-O2',
      'C2-070-O2',
      'C2-007-O2',
      'C2-008-O2',
      'C2-081-O5',
      'C2-089-O3',
    ]);
    expect(run.flags).toMatchObject({ v_zy_duty: 1 });
    expect(run.currentNodeId).toBe('C2-009');
  });

  it('担责清单部分选择 → duty=1；全选 → duty=2', () => {
    const base = startChapter(STORY_INDEX, 'ch2');
    const atChecklist: RunState = { ...base, currentNodeId: 'C2-086' };
    const partial = completeChecklist(atChecklist, STORY_INDEX, ['item1', 'item2']);
    expect(partial.flags.v_zy_duty).toBe(1);

    const all = completeChecklist(atChecklist, STORY_INDEX, [
      'item1',
      'item2',
      'item3',
      'item4',
      'item5',
      'item6',
    ]);
    expect(all.flags.v_zy_duty).toBe(2);
  });

  it('C2-005 按 Ch1 四变体 × 留群标记渲染跨章消息', () => {
    const base = startChapter(STORY_INDEX, 'ch2');
    const node = STORY_INDEX.nodes.get('C2-005')!;
    const textsFor = (flags: Record<string, number>) => {
      const run: RunState = { ...base, currentNodeId: 'C2-005', flags };
      return visibleChatMessages(run, node).map((msg) => msg.text).join('\n');
    };

    const v0 = textsFor({ v_xm_variant: 0 });
    expect(v0).toContain('这是昨晚的完整记录');
    expect(v0).toContain('聊天记录谁不会 P');

    const v1 = textsFor({ v_xm_variant: 1 });
    expect(v1).toContain('昨晚我原话是');
    expect(v1).toContain('口说无凭 谁不会编');

    const v2 = textsFor({ v_xm_variant: 2, v_xm_stay: 1 });
    expect(v2).toContain('林小满 发来一条私信');
    expect(v2).toContain('你的组长和汇报排在第一个');
    expect(v2).toContain('成员列表');

    const v3 = textsFor({ v_xm_variant: 3 });
    expect(v3).toContain('群里没有人替她说话');

    const fallback = textsFor({});
    expect(fallback).toContain('群里没有人替她说话');
  });
});