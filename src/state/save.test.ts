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
    runId: 'run-test',
    chapter: 'ch1',
    currentNodeId: 'C1-005',
    flags: { v_xm_help: 2, v_did_teacher: true },
    chatPlayed: 3,
    clues: ['EV-01'],
    visitedNodes: ['C1-001', 'C1-005'],
    ...over,
  };
}

describe('LocalStorage 存档（单槽位 v2，P-014）', () => {
  it('run 存取往返一致', () => {
    setStorageBackendForTests(makeStorage());
    saveRun(sampleRun());
    expect(loadRun()).toEqual(sampleRun());
    expect(hasRun()).toBe(true);
  });

  it('单槽位覆盖保存只保留最新一局', () => {
    setStorageBackendForTests(makeStorage());
    saveRun(sampleRun());
    saveRun(sampleRun({ currentNodeId: 'C1-901', flags: { v_zy_duty: 2 } }));
    const run = loadRun();
    expect(run?.currentNodeId).toBe('C1-901');
    expect(run?.flags.v_zy_duty).toBe(2);
  });

  it('清除存档后读取为 null', () => {
    setStorageBackendForTests(makeStorage());
    saveRun(sampleRun());
    clearRun();
    expect(loadRun()).toBeNull();
    expect(hasRun()).toBe(false);
  });

  it('空槽位读取返回 null 而非抛错；meta 缺省结构完整', () => {
    setStorageBackendForTests(makeStorage());
    expect(loadRun()).toBeNull();
    const meta = loadMeta();
    expect(meta.firstRunCompleted).toBe(false);
    expect(meta.unlockedChapters).toEqual(['ch1']);
    expect(meta.endingsSeen).toEqual([]);
    expect(meta.clueLog).toEqual([]);
  });

  it('meta 图鉴读写一致（结局 id 为 E1–E5）', () => {
    setStorageBackendForTests(makeStorage());
    saveMeta({
      firstRunCompleted: true,
      unlockedChapters: ['ch1'],
      endingsSeen: ['E1', 'E5'],
      clueLog: ['EV-01'],
    });
    const meta = loadMeta();
    expect(meta.endingsSeen).toEqual(['E1', 'E5']);
    expect(meta.clueLog).toEqual(['EV-01']);
    expect(meta.firstRunCompleted).toBe(true);
  });

  it('旧 v2 档缺少 deletedMessages 时按空数组兼容；新字段可往返', () => {
    const legacy = sampleRun();
    setStorageBackendForTests(
      makeStorage({
        'eos.save.v2': JSON.stringify({ version: 2, updatedAt: 1, data: legacy }),
      }),
    );
    const loaded = loadRun();
    expect(loaded?.deletedMessages).toBeUndefined();
    expect(loaded?.deletedMessages ?? []).toEqual([]);

    setStorageBackendForTests(makeStorage());
    saveRun(sampleRun({ deletedMessages: ['对不起', '你还好吗'] }));
    expect(loadRun()?.deletedMessages).toEqual(['对不起', '你还好吗']);
  });

  it('旧 meta 缺少 completedChapters/carriedFlags 时兼容', () => {
    setStorageBackendForTests(
      makeStorage({
        'eos.meta.v2': JSON.stringify({
          version: 2,
          updatedAt: 1,
          data: {
            firstRunCompleted: true,
            unlockedChapters: ['ch1'],
            endingsSeen: ['E1'],
            clueLog: ['EV-01'],
          },
        }),
      }),
    );
    const meta = loadMeta();
    expect(meta.completedChapters ?? []).toEqual([]);
    expect(meta.carriedFlags).toBeUndefined();
  });

  it('损坏的存档 JSON / 版本号不匹配 按无存档处理', () => {
    setStorageBackendForTests(
      makeStorage({
        'eos.save.v2': '{oops-not-json',
        'eos.meta.v2': JSON.stringify({ version: 999, data: {} }),
      }),
    );
    expect(loadRun()).toBeNull();
    expect(loadMeta().endingsSeen).toEqual([]);
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
    saveRun(sampleRun());
    expect(loadRun()).toBeNull();
  });
});
