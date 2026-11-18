import type { ChapterId, Flags, ProgressMeta } from '../engine/types';

const CHAPTER_ORDER: ChapterId[] = ['ch1', 'ch2', 'ch3'];

/** 完成某章后应解锁的章节（FR-09）。 */
export function unlockedAfter(chapter: ChapterId): ChapterId[] {
  if (chapter === 'ch1') return ['ch1', 'ch2'];
  if (chapter === 'ch2') return ['ch1', 'ch2', 'ch3'];
  return ['ch1', 'ch2', 'ch3'];
}

export function mergeUnlocked(current: ChapterId[], chapter: ChapterId): ChapterId[] {
  const set = new Set<ChapterId>([...current, ...unlockedAfter(chapter)]);
  return CHAPTER_ORDER.filter((item) => set.has(item));
}

/** 携带重玩只保留共享状态，不带走行动窗口的临时标记。 */
export function carryableFlags(flags: Flags): Flags {
  return Object.fromEntries(
    Object.entries(flags).filter(([key]) => !key.startsWith('v_did_')),
  );
}

export function mergeCompleted(
  meta: ProgressMeta,
  chapter: ChapterId,
): ChapterId[] {
  return Array.from(new Set([...(meta.completedChapters ?? []), chapter]));
}