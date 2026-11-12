import { describe, expect, it } from 'vitest';
import {
  clearRun,
  hasRun,
  loadMeta,
  loadRun,
  saveMeta,
  saveRun,
  setStorageBackendForTests,
  type StorageLike,
} from './save';
import type { RunState } from '../engine/types';

function makeStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

function sampleRun(over: Partial<RunState> = {}): RunState {
  return {
    runId: 'main-test',
    chapter: 'ch1',
    currentNodeId: 'C1-005',
    flags: { W_evidence: true, R_level: 0 },
    chatPlayed: 3,
    clues: ['clue-red-banner'],
    visitedNodes: ['C1-001', 'C1-005'],
    isEcho: false,
    ...over,
  };
}

describe('LocalStorage 存档', () => {
  it('run 存取往返一致', () => {
    setStorageBackendForTests(makeStorage());
    saveRun('main', sampleRun());
    expect(loadRun('main')).toEqual(sampleRun());
    expect(hasRun('main')).toBe(true);
  });

  it('回声槽位与首通槽位互相隔离（PRD 提案 D）', () => {
    setStorageBackendForTests(makeStorage());
    saveRun('main', sampleRun());
    saveRun('echo', sampleRun({ isEcho: true, chapter: 'ch3', runId: 'echo-test' }));
    expect(loadRun('main')?.isEcho).toBe(false);
    const echo = loadRun('echo');
    expect(echo?.isEcho).toBe(true);
    expect(echo?.chapter).toBe('ch3');
  });

  it('清除存档后读取为 null', () => {
    setStorageBackendForTests(makeStorage());
    saveRun('echo', sampleRun({ isEcho: true }));
    clearRun('echo');
    expect(loadRun('echo')).toBeNull();
    expect(hasRun('echo')).toBe(false);
  });

  it('空槽位读取返回 null 而非抛错；meta 缺省结构完整', () => {
    setStorageBackendForTests(makeStorage());
    expect(loadRun('main')).toBeNull();
    const meta = loadMeta();
    expect(meta.endingsSeen).toEqual([]);
    expect(meta.clueLog).toEqual([]);
    expect(meta.unlockedChapters).toEqual(['ch1']);
  });

  it('meta 图鉴读写一致', () => {
    setStorageBackendForTests(makeStorage());
    saveMeta({
      firstRunCompleted: false,
      unlockedChapters: ['ch1'],
      endingsSeen: ['silence'],
      clueLog: ['clue-a'],
    });
    expect(loadMeta().endingsSeen).toEqual(['silence']);
    expect(loadMeta().clueLog).toEqual(['clue-a']);
  });

  it('损坏的存档 JSON / 版本号不匹配 按无存档处理', () => {
    setStorageBackendForTests(
      makeStorage({
        'eos.save.main.v1': '{oops-not-json',
        'eos.save.echo.v1': JSON.stringify({ version: 999, data: {} }),
      }),
    );
    expect(loadRun('main')).toBeNull();
    expect(loadRun('echo')).toBeNull();
  });

  it('存储后端抛错时静默失败，不中断游戏', () => {
    setStorageBackendForTests({
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    });
    saveRun('main', sampleRun());
    expect(loadRun('main')).toBeNull();
  });
});
