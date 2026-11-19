import { describe, expect, it } from 'vitest';
import { applyFlags, readFlag, testCondition } from './conditions';
import { evaluateEnding, JUDGEMENT_VARS } from './endings';
import {
  advanceNode,
  buildStoryIndex,
  chooseOption,
  enterNode,
  solveReasoning,
  startChapter,
  visibleChatMessages,
  visibleNodeText,
  visibleOptions,
  visibleReasoningClues,
} from './engine';
import type { EndingId, RunState, StoryNode } from './types';

function runOf(partial: Partial<RunState> = {}): RunState {
  return {
    runId: 'test',
    chapter: 'ch1',
    currentNodeId: 'C1-001',
    flags: {},
    chatPlayed: 0,
    clues: [],
    visitedNodes: [],
    ...partial,
  };
}

describe('readFlag / testCondition 真值语法', () => {
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
    const run = runOf({ clues: ['EV-01'] });
    expect(testCondition(run, { clues: ['EV-01'] })).toBe(true);
    expect(testCondition(run, { clues: ['EV-01', 'EV-02'] })).toBe(false);
    expect(testCondition(run, { noClues: ['EV-02'] })).toBe(true);
    expect(testCondition(run, { noClues: ['EV-01'] })).toBe(false);
  });

  it('applyFlags 合并写入', () => {
    expect(applyFlags({ a: true }, { b: 2, c: 'x' })).toEqual({ a: true, b: 2, c: 'x' });
    expect(applyFlags({ a: true })).toEqual({ a: true });
  });
});

describe('readFlag 数值比较语法（v_* 变量，P-014）', () => {
  it('支持 >= <= > < = == !=；变量缺省按 0', () => {
    const flags = { v_xm_help: 2, v_zy_duty: -1 };
    expect(readFlag(flags, 'v_xm_help>=2')).toBe(true);
    expect(readFlag(flags, 'v_xm_help>=3')).toBe(false);
    expect(readFlag(flags, 'v_xm_help>1')).toBe(true);
    expect(readFlag(flags, 'v_xm_help<=2')).toBe(true);
    expect(readFlag(flags, 'v_xm_help<2')).toBe(false);
    expect(readFlag(flags, 'v_xm_help=2')).toBe(true);
    expect(readFlag(flags, 'v_xm_help==2')).toBe(true);
    expect(readFlag(flags, 'v_xm_help!=2')).toBe(false);
    expect(readFlag(flags, 'v_zy_duty<=-1')).toBe(true);
    expect(readFlag(flags, 'v_zy_duty=-1')).toBe(true);
    expect(readFlag(flags, 'v_cy_echo=0')).toBe(true);
    expect(readFlag(flags, 'v_cy_echo!=0')).toBe(false);
  });

  it('! 前缀对比较结果取反；true 按 1 参与比较', () => {
    const flags = { v_xm_help: 1, v_cy_echo: true };
    expect(readFlag(flags, '!v_xm_help>=2')).toBe(true);
    expect(readFlag(flags, '!v_xm_help=1')).toBe(false);
    expect(readFlag(flags, 'v_cy_echo=1')).toBe(true);
  });

  it('比较语法可用于 all / any / none 组合', () => {
    const run = runOf({ flags: { v_xm_help: 2, v_zy_duty: 0 } });
    expect(testCondition(run, { all: ['v_xm_help>=2', 'v_zy_duty<=0'] })).toBe(true);
    expect(testCondition(run, { all: ['v_xm_help>=2', 'v_zy_duty=2'] })).toBe(false);
    expect(testCondition(run, { none: ['v_xm_help=3'] })).toBe(true);
    expect(testCondition(run, { any: ['v_xm_help=3', 'v_zy_duty=-1'] })).toBe(false);
  });
});

/** GAMEPLAY_DESIGN §7.1 的独立重述，用于与引擎实现做表驱动比对 */
function matrixReference(help: number, duty: number, act: number, echo: number): EndingId {
  if (help >= 2 && duty === 2 && act >= 2 && echo === 0) return 'E5';
  if (duty === 2) return 'E4';
  if (help >= 2) return 'E3';
  if (help === 0 && duty <= 0 && act === 0) return 'E1';
  return 'E2';
}

describe('evaluateEnding 判定矩阵（GAMEPLAY_DESIGN §7.1）', () => {
  it('E5 优先级最高：help>=2 且 duty=2 且 act>=2 且 echo=0', () => {
    expect(evaluateEnding({ v_xm_help: 2, v_zy_duty: 2, v_cy_act: 2, v_cy_echo: 0 })).toBe('E5');
    expect(evaluateEnding({ v_xm_help: 3, v_zy_duty: 2, v_cy_act: 3 })).toBe('E5');
  });

  it('v_cy_echo=1 时封顶 E4：即使其余三值满足 E5 条件', () => {
    expect(evaluateEnding({ v_xm_help: 2, v_zy_duty: 2, v_cy_act: 2, v_cy_echo: 1 })).toBe('E4');
  });

  it('E4 次之：duty=2（act 不足时同样命中）', () => {
    expect(evaluateEnding({ v_xm_help: 2, v_zy_duty: 2, v_cy_act: 1 })).toBe('E4');
    expect(evaluateEnding({ v_zy_duty: 2 })).toBe('E4');
  });

  it('E3：help>=2 且 duty!=2', () => {
    expect(evaluateEnding({ v_xm_help: 2, v_cy_act: 2 })).toBe('E3');
    expect(evaluateEnding({ v_xm_help: 3, v_zy_duty: 1 })).toBe('E3');
  });

  it('E1：help=0 且 duty<=0 且 act=0；变量缺省按 0，全空即 E1', () => {
    expect(evaluateEnding({})).toBe('E1');
    expect(evaluateEnding({ v_zy_duty: -1 })).toBe('E1');
  });

  it('E2 兜底：其余组合', () => {
    expect(evaluateEnding({ v_xm_help: 1 })).toBe('E2');
    expect(evaluateEnding({ v_zy_duty: 1 })).toBe('E2');
    expect(evaluateEnding({ v_cy_act: 1 })).toBe('E2');
  });

  it('判定变量元数据与 GAMEPLAY_DESIGN §5 取值范围一致', () => {
    expect(JUDGEMENT_VARS.map((v) => [v.key, v.min, v.max])).toEqual([
      ['v_xm_help', 0, 3],
      ['v_zy_duty', -1, 2],
      ['v_cy_act', 0, 3],
      ['v_cy_echo', 0, 1],
    ]);
  });

  it('128 组合表驱动：与 §7.1 独立重述逐一一致，五个结局均可达', () => {
    const rangeOf = (key: string) => {
      const v = JUDGEMENT_VARS.find((item) => item.key === key);
      if (!v) throw new Error(`JUDGEMENT_VARS 缺少 ${key}`);
      return v;
    };
    const helpVar = rangeOf('v_xm_help');
    const dutyVar = rangeOf('v_zy_duty');
    const actVar = rangeOf('v_cy_act');
    const echoVar = rangeOf('v_cy_echo');

    let combos = 0;
    const seen = new Set<EndingId>();
    for (let help = helpVar.min; help <= helpVar.max; help++) {
      for (let duty = dutyVar.min; duty <= dutyVar.max; duty++) {
        for (let act = actVar.min; act <= actVar.max; act++) {
          for (let echo = echoVar.min; echo <= echoVar.max; echo++) {
            const label = `help=${help} duty=${duty} act=${act} echo=${echo}`;
            const ending = evaluateEnding({
              v_xm_help: help,
              v_zy_duty: duty,
              v_cy_act: act,
              v_cy_echo: echo,
            });
            expect(ending, label).toBe(matrixReference(help, duty, act, echo));
            combos += 1;
            seen.add(ending);
          }
        }
      }
    }
    expect(combos).toBe(128);
    expect([...seen].sort()).toEqual(['E1', 'E2', 'E3', 'E4', 'E5']);
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
    clueId: 'EV-01',
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
      { id: 'm1', side: 'left', sender: 'classmateA', text: '普通消息' },
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

const index = buildStoryIndex(storyNodes, { ch1: 'C1-001' });

describe('engine 节点推进', () => {
  it('startChapter 从章节起始节点进入', () => {
    const run = startChapter(index, 'ch1');
    expect(run.currentNodeId).toBe('C1-001');
    expect(run.visitedNodes).toEqual(['C1-001']);
    expect(run.flags).toEqual({});
  });

  it('未注册章节不可开始', () => {
    expect(() => startChapter(index, 'ch2')).toThrowError();
  });

  it('enterNode 应用 effects、收集线索、记录访问', () => {
    let run = enterNode(runOf(), index, 'C1-002');
    expect(run.flags.temp_a).toBe(true);
    expect(run.clues).toEqual(['EV-01']);
    run = enterNode(run, index, 'C1-002');
    expect(run.clues).toEqual(['EV-01']);
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

  it('visibleReasoningClues 过滤条件线索；solveReasoning 仅正确时写 solvedEffects', () => {
    const reasoningNode: StoryNode = {
      id: 'C1-001',
      chapter: 'ch1',
      kind: 'reasoning',
      reasoning: {
        prompt: '谁？',
        clues: ['基础线索'],
        conditionalClues: [
          { text: '条件线索', requires: { clues: ['EV-08'] } },
        ],
        candidates: [{ id: 'a', text: '甲', correct: true }],
        wrongFeedback: '错',
        solvedEffects: { v_did_ident: 1 },
      },
      goto: 'C1-002',
    };
    const index = buildStoryIndex(
      [reasoningNode, { id: 'C1-002', chapter: 'ch1', kind: 'ending' }],
      { ch1: 'C1-001' },
    );

    expect(visibleReasoningClues(runOf(), reasoningNode.reasoning!)).toEqual([
      '基础线索',
    ]);
    expect(
      visibleReasoningClues(runOf({ clues: ['EV-08'] }), reasoningNode.reasoning!),
    ).toEqual(['基础线索', '条件线索']);

    const solved = solveReasoning(runOf({ currentNodeId: 'C1-001' }), index);
    expect(solved.flags.v_did_ident).toBe(1);
    expect(solved.currentNodeId).toBe('C1-002');
  });

  it('visibleNodeText 使用首个满足条件的文本变体', () => {
    const node: StoryNode = {
      id: 'C1-001',
      chapter: 'ch1',
      kind: 'dialogue',
      speaker: 'mom',
      text: '基础文本',
      variants: [{ requires: { all: ['v_x'] }, text: '变体文本' }],
      goto: 'C1-002',
    };
    expect(visibleNodeText(runOf(), node)).toBe('基础文本');
    expect(visibleNodeText(runOf({ flags: { v_x: 1 } }), node)).toBe('变体文本');
  });
});
