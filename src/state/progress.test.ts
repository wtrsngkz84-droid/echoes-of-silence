import { describe, expect, it } from 'vitest';
import { carryableFlags, mergeCompleted, mergeUnlocked, unlockedAfter } from './progress';
import type { ProgressMeta } from '../engine/types';

describe('章节解锁链与携带重玩', () => {
  it('完成第一章解锁第二章，完成第二章解锁第三章', () => {
    expect(unlockedAfter('ch1')).toEqual(['ch1', 'ch2']);
    expect(unlockedAfter('ch2')).toEqual(['ch1', 'ch2', 'ch3']);
    expect(mergeUnlocked(['ch1'], 'ch2')).toEqual(['ch1', 'ch2', 'ch3']);
    expect(mergeUnlocked(['ch1'], 'ch1')).toEqual(['ch1', 'ch2']);
  });

  it('携带重玩过滤 v_did_* 临时标记', () => {
    expect(
      carryableFlags({ v_xm_help: 3, v_zy_duty: 2, v_did_teacher: 1, v_did_boost: 1 }),
    ).toEqual({ v_xm_help: 3, v_zy_duty: 2 });
  });

  it('已完成章节去重并保留顺序', () => {
    const meta: ProgressMeta = {
      firstRunCompleted: true,
      unlockedChapters: ['ch1', 'ch2'],
      endingsSeen: ['E4'],
      clueLog: [],
      completedChapters: ['ch1'],
    };
    expect(mergeCompleted(meta, 'ch1')).toEqual(['ch1']);
    expect(mergeCompleted(meta, 'ch2')).toEqual(['ch1', 'ch2']);
  });
});