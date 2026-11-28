import { describe, expect, it } from 'vitest';
import type { ChapterId, RunState } from '../engine/types';
import { trackForScreen } from './track';

function run(chapter: ChapterId, currentNodeId: string): RunState {
  return {
    runId: 'bgm-test',
    chapter,
    currentNodeId,
    flags: {},
    chatPlayed: 0,
    clues: [],
    visitedNodes: [],
  };
}

describe('BGM 章节映射', () => {
  it('标题/结局回 menu，三章与 3min 段落映射正确', () => {
    expect(trackForScreen('title', null)).toBe('menu');
    expect(trackForScreen('warning', null)).toBe('menu');
    expect(trackForScreen('ending', null)).toBe('menu');

    expect(trackForScreen('game', run('ch1', 'C1-001'))).toBe('ch1');
    expect(trackForScreen('game', run('ch2', 'C2-001'))).toBe('ch2');
    expect(trackForScreen('game', run('ch3', 'C3-001'))).toBe('ch3');

    expect(trackForScreen('game', run('3min', 'S1-001'))).toBe('ch1');
    expect(trackForScreen('game', run('3min', 'S2-001'))).toBe('ch2');
    expect(trackForScreen('game', run('3min', 'S3-001'))).toBe('ch3');
    expect(trackForScreen('game', run('3min', 'S4-001'))).toBe('ch3');
    expect(trackForScreen('game', run('3min', 'S5-001'))).toBe('menu');
  });
});