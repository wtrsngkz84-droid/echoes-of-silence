import { describe, expect, it } from 'vitest';
import { hasBlockingIssues, validateStory } from './validation';
import type { ClueDef, StoryNode } from './types';

const clues: ClueDef[] = [
  { id: 'clue-a', name: '线索甲', description: '', chapters: ['ch1'] },
];

const okNodes: StoryNode[] = [
  {
    id: 'C1-001',
    chapter: 'ch1',
    kind: 'narration',
    text: 'a',
    goto: 'C1-002',
  },
  {
    id: 'C1-002',
    chapter: 'ch1',
    kind: 'ending',
    text: undefined,
  },
];

describe('validateStory 剧情数据校验', () => {
  it('合法数据无阻断问题', () => {
    const issues = validateStory(okNodes, clues, { ch1: 'C1-001' });
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(hasBlockingIssues(issues)).toBe(false);
  });

  it('goto 目标不存在 → error', () => {
    const broken: StoryNode[] = [
      { ...okNodes[0], goto: 'C1-999' },
    ];
    const issues = validateStory(broken, clues, { ch1: 'C1-001' });
    expect(hasBlockingIssues(issues)).toBe(true);
    expect(issues.some((i) => i.message.includes('C1-999'))).toBe(true);
  });

  it('节点 id 重复 / chat 缺 messages / dialogue 缺 speaker → error', () => {
    const broken: StoryNode[] = [
      { ...okNodes[0], id: 'C1-002' },
      {
        id: 'C1-003',
        chapter: 'ch1',
        kind: 'chat',
        chatTitle: '空群',
        messages: [],
        text: undefined,
        goto: 'C1-001',
      },
      {
        id: 'C1-004',
        chapter: 'ch1',
        kind: 'dialogue',
        text: '没有说话人',
        goto: 'C1-001',
      },
    ];
    const issues = validateStory(broken, clues, { ch1: 'C1-001' });
    expect(issues.filter((i) => i.level === 'error').length).toBeGreaterThanOrEqual(4);
  });

  it('无选项节点缺 goto / 线索不存在 / 章节起点缺失 → error', () => {
    const broken: StoryNode[] = [
      { id: 'C1-001', chapter: 'ch1', kind: 'narration', text: '悬挂' },
      {
        id: 'C1-002',
        chapter: 'ch1',
        kind: 'narration',
        text: '线索引用断裂',
        clueId: 'clue-missing',
        goto: 'C1-001',
      },
    ];
    const issues = validateStory(broken, clues, { ch1: 'C1-040' });
    expect(hasBlockingIssues(issues)).toBe(true);
    expect(issues.some((i) => i.message.includes('clue-missing'))).toBe(true);
    expect(issues.some((i) => i.message.includes('起始节点不存在'))).toBe(true);
  });

  it('screenshot 消息缺少截图内容 → error', () => {
    const broken: StoryNode[] = [
      {
        id: 'C1-001',
        chapter: 'ch1',
        kind: 'chat',
        chatTitle: '群',
        messages: [
          { id: 'm1', side: 'left', sender: 'gaoxiang', text: 'x', kind: 'screenshot' },
        ],
        goto: 'C1-002',
      },
      okNodes[1],
    ];
    const issues = validateStory(broken, clues, { ch1: 'C1-001' });
    expect(hasBlockingIssues(issues)).toBe(true);
    expect(issues.some((i) => i.message.includes('screenshot 消息缺少截图内容'))).toBe(true);
  });

  it('节点 id 不符合命名约定 → warning 不阻断', () => {
    const odd: StoryNode[] = [
      { ...okNodes[0], id: 'bad-id', goto: 'C1-002' },
      okNodes[1],
    ];
    const issues = validateStory(odd, clues, { ch1: 'bad-id' });
    expect(hasBlockingIssues(issues)).toBe(false);
    expect(issues.some((i) => i.level === 'warning')).toBe(true);
  });
});
