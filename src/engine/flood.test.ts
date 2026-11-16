import { describe, expect, it } from 'vitest';
import { autoFloodActive } from './engine';
import {
  DEFAULT_FLOOD_INTERVAL_MS,
  createFloodState,
  floodIntervalMs,
  setFloodSpeed,
  startFlood,
  syncFloodState,
  tickFlood,
  toggleFloodPause,
} from './flood';
import type { RunState, StoryNode } from './types';

describe('flood 自动上涌状态机', () => {
  it('初始 idle；start 后逐条 tick，完成后 done 且不再前进', () => {
    let state = createFloodState(3);
    expect(state.status).toBe('idle');
    expect(state.revealed).toBe(0);

    state = startFlood(state);
    expect(state.status).toBe('playing');

    state = tickFlood(state);
    expect([state.revealed, state.status]).toEqual([1, 'playing']);
    state = tickFlood(state);
    state = tickFlood(state);
    expect([state.revealed, state.status]).toEqual([3, 'done']);

    const after = tickFlood(state);
    expect(after).toBe(state);
  });

  it('暂停时 tick 不推进；恢复后继续；done 后不可暂停', () => {
    let state = startFlood(createFloodState(2));
    state = toggleFloodPause(state);
    expect(state.status).toBe('paused');
    expect(tickFlood(state)).toBe(state);

    state = toggleFloodPause(state);
    expect(state.status).toBe('playing');
    state = tickFlood(tickFlood(state));
    expect(state.status).toBe('done');
    expect(toggleFloodPause(state)).toBe(state);
  });

  it('2× 时区间减半，且有最小间隔', () => {
    const state = createFloodState(5);
    expect(floodIntervalMs(state)).toBe(DEFAULT_FLOOD_INTERVAL_MS);
    const fast = setFloodSpeed(state, 2);
    expect(floodIntervalMs(fast)).toBe(DEFAULT_FLOOD_INTERVAL_MS / 2);
    expect(floodIntervalMs(fast, 200)).toBe(100);
    expect(floodIntervalMs(fast, 100)).toBe(80);
    expect(floodIntervalMs(fast, 20)).toBe(80);
  });

  it('外部推进 revealed 时同步状态，暂停态保持', () => {
    let state = startFlood(createFloodState(4));
    state = toggleFloodPause(state);
    state = syncFloodState(state, 2, 4);
    expect([state.revealed, state.status]).toEqual([2, 'paused']);

    const done = syncFloodState(state, 4, 4);
    expect(done.status).toBe('done');
  });
});

describe('autoFloodActive 首遍门控', () => {
  const node: StoryNode = {
    id: 'C1-005',
    chapter: 'ch1',
    kind: 'chat',
    autoFlood: true,
    floodFrom: 2,
    messages: [
      { id: 'm1', side: 'left', text: '1' },
      { id: 'm2', side: 'left', text: '2' },
      { id: 'm3', side: 'left', text: '3' },
    ],
    goto: 'C1-006',
  };
  const run: RunState = {
    runId: 'test',
    chapter: 'ch1',
    currentNodeId: 'C1-005',
    flags: {},
    chatPlayed: 0,
    clues: [],
    visitedNodes: [],
  };

  it('起点前可手动点击；进入上涌段后不可点击跳过；播完解除', () => {
    expect(autoFloodActive({ ...run, chatPlayed: 1 }, node)).toBe(false);
    expect(autoFloodActive({ ...run, chatPlayed: 2 }, node)).toBe(true);
    expect(autoFloodActive({ ...run, chatPlayed: 3 }, node)).toBe(false);
  });

  it('非 chat 节点或未标记 autoFlood 时为 false', () => {
    expect(autoFloodActive(run, { ...node, kind: 'inner', text: 'x' })).toBe(false);
    expect(autoFloodActive(run, { ...node, autoFlood: false })).toBe(false);
  });
});
