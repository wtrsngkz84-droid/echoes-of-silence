import { describe, expect, it } from 'vitest';
import { applyFlags, readFlag, testCondition } from './conditions';
import { evaluateEnding } from './endings';
import {
  advanceNode,
  buildStoryIndex,
  enterNode,
  chooseOption,
  startChapter,
  visibleChatMessages,
  visibleOptions,
} from './engine';
import type { ChapterId, RunState, StoryNode } from './types';

function runOf(partial: Partial<RunState> = {}): RunState {
  return {
    runId: 'test',
    chapter: 'ch1',
    currentNodeId: 'C1-001',
    flags: {},
    chatPlayed: 0,
    clues: [],
    visitedNodes: [],
    isEcho: false,
    ...partial,
  };
}

describe('readFlag / testCondition', () => {
  it('真值判断与 ! 取反', () => {
    const flags = { a: true, b: false, c: 0, d: 'x' };
    expect(readFlag(flags, 'a')).toBe(true);
    expect(readFlag(flags, 'b')).toBe(false);
    expect(readFlag(flags, 'c')).toBe(false);
    expect(readFlag(flags, 'd')).toBe(true);
    expect(readFlag(flags, '!b')).toBe(true);
    expect(readFlag(flags, '!a')).toBe(false);
    expect(readFlag(flags, 'missing')).toBe(false);
    expect(readFlag(flags, '!missing')).toBe(true);
  });

  it('all / any / none 组合', () => {
    const run = runOf({ flags: { a: true, b: false } });
    expect(testCondition(run, { all: ['a'] })).toBe(true);
    expect(testCondition(run, { all: ['a', 'b'] })).toBe(false);
    expect(testCondition(run, { any: ['b', 'a'] })).toBe(true);
    expect(testCondition(run, { any: ['b'] })).toBe(false);
    expect(testCondition(run, { none: ['b'] })).toBe(true);
    expect(testCondition(run, { none: ['a'] })).toBe(false);
    expect(testCondition(run, undefined)).toBe(true);
  });

  it('线索条件 clues / noClues', () => {
    const run = runOf({ clues: ['clue-a'] });
    expect(testCondition(run, { clues: ['clue-a'] })).toBe(true);
    expect(testCondition(run, { clues: ['clue-a', 'clue-b'] })).toBe(false);
    expect(testCondition(run, { noClues: ['clue-b'] })).toBe(true);
    expect(testCondition(run, { noClues: ['clue-a'] })).toBe(false);
  });

  it('applyFlags 合并写入', () => {
    expect(applyFlags({ a: true }, { b: 2, c: 'x' })).toEqual({ a: true, b: 2, c: 'x' });
    expect(applyFlags({ a: true })).toEqual({ a: true });
  });
});

describe('evaluateEnding（STORY_FLOW §4.1）', () => {
  it('S2 优先级最高：S_early 或 W_asked_early → 及时止损', () => {
    expect(evaluateEnding({ S_early: true, R_level: 2, W_asked_again: true })).toBe('timely');
    expect(evaluateEnding({ W_asked_early: true })).toBe('timely');
  });

  it('R2 次之：R_level==2 → 责任的重量', () => {
    expect(evaluateEnding({ R_level: 2, W_asked_again: true })).toBe('responsibility');
    expect(evaluateEnding({ R_level: 1, W_asked_again: true })).toBe('again');
  });

  it('S1：W_asked_again 或 S_late → 再次求助', () => {
    expect(evaluateEnding({ W_asked_again: true })).toBe('again');
    expect(evaluateEnding({ S_late: true })).toBe('again');
  });

  it('全空 → 沉默的代价；变量缺省按假处理', () => {
    expect(evaluateEnding({})).toBe('silence');
    expect(evaluateEnding({ S_early: false, R_level: 0 })).toBe('silence');
  });
});

const storyNodes: StoryNode[] = [
  {
    id: 'C1-001',
    chapter: 'ch1',
    kind: 'narration',
    text: '开头',
    goto: 'C1-002',
  },
  {
    id: 'C1-002',
    chapter: 'ch1',
    kind: 'dialogue',
    speaker: 'xiaoman',
    text: '选项节点',
    effects: { temp_a: true },
    clueId: 'clue-a',
    options: [
      { id: 'C1-002-O1', text: '甲', goto: 'C1-003', effects: { path: 'a' } },
      {
        id: 'C1-002-O2',
        text: '乙',
        goto: 'C1-003',
        requires: { all: ['hidden'] },
      },
    ],
  },
  {
    id: 'C1-003',
    chapter: 'ch1',
    kind: 'chat',
    chatTitle: '测试群',
    text: undefined,
    messages: [
      { id: 'm1', side: 'left', sender: 'gaoxiang', text: '普通消息' },
      {
        id: 'm2',
        side: 'right',
        text: '条件消息',
        requires: { all: ['path'] },
      },
    ],
    goto: 'C1-004',
  },
  {
    id: 'C1-004',
    chapter: 'ch1',
    kind: 'inner',
    text: '结束前',
    goto: 'C1-005',
  },
  {
    id: 'C1-005',
    chapter: 'ch1',
    kind: 'ending',
    text: undefined,
    endingNote: '结局节点无需 goto',
  },
];

const index = buildStoryIndex(storyNodes, { ch1: 'C1-001' } as Partial<Record<ChapterId, string>>);

describe('engine 节点推进', () => {
  it('startChapter 从章节起始节点进入', () => {
    const run = startChapter(index, 'ch1', false);
    expect(run.currentNodeId).toBe('C1-001');
    expect(run.visitedNodes).toEqual(['C1-001']);
    expect(run.isEcho).toBe(false);
  });

  it('未注册章节不可开始', () => {
    expect(() => startChapter(index, 'ch2', false)).toThrowError();
  });

  it('enterNode 应用 effects、收集线索、记录访问', () => {
    let run = enterNode(runOf(), index, 'C1-002');
    expect(run.flags.temp_a).toBe(true);
    expect(run.clues).toEqual(['clue-a']);
    run = enterNode(run, index, 'C1-002');
    expect(run.clues).toEqual(['clue-a']);
    expect(run.visitedNodes.filter((n) => n === 'C1-002')).toHaveLength(1);
    expect(run.chatPlayed).toBe(0);
  });

  it('advanceNode 沿 goto 推进；缺 goto 抛错', () => {
    const run = advanceNode(runOf({ currentNodeId: 'C1-001' }), index);
    expect(run.currentNodeId).toBe('C1-002');
    expect(() => advanceNode(runOf({ currentNodeId: 'C1-002' }), index)).toThrowError();
  });

  it('chooseOption 应用 effects 并跳转；不满足条件的选项不可选', () => {
    const atChoice = runOf({ currentNodeId: 'C1-002' });
    const chosen = chooseOption(atChoice, index, 'C1-002-O1');
    expect(chosen.currentNodeId).toBe('C1-003');
    expect(chosen.flags.path).toBe('a');
    expect(() => chooseOption(atChoice, index, 'C1-002-O2')).toThrowError();
    expect(() => chooseOption(atChoice, index, '不存在')).toThrowError();
  });

  it('visibleOptions 过滤条件选项', () => {
    expect(visibleOptions(runOf({ currentNodeId: 'C1-002' }), storyNodes[1])).toHaveLength(1);
    const unlocked = runOf({
      currentNodeId: 'C1-002',
      flags: { hidden: true },
    });
    expect(visibleOptions(unlocked, storyNodes[1])).toHaveLength(2);
  });

  it('visibleChatMessages 按 requires 过滤', () => {
    const chatNode = storyNodes[2];
    expect(visibleChatMessages(runOf(), chatNode)).toHaveLength(1);
    expect(
      visibleChatMessages(runOf({ flags: { path: 'a' } }), chatNode),
    ).toHaveLength(2);
  });
});
