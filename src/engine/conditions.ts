import type { Condition, Flags, FlagValue, RunState } from './types';

/**
 * flag 引用语法：'name' 为真值判断，'!name' 为取反。
 * 0、''、false、undefined 视为假。
 */
export function readFlag(flags: Flags, ref: string): boolean {
  const negated = ref.startsWith('!');
  const key = negated ? ref.slice(1) : ref;
  const raw: FlagValue | undefined = flags[key];
  const truthy = raw !== undefined && raw !== false && raw !== 0 && raw !== '';
  return negated ? !truthy : truthy;
}

/** 组合条件求值（flag + 线索） */
export function testCondition(run: Pick<RunState, 'flags' | 'clues'>, cond?: Condition): boolean {
  if (!cond) return true;

  const { flags, clues } = run;
  if (cond.all && !cond.all.every((ref) => readFlag(flags, ref))) return false;
  if (cond.any && cond.any.length > 0 && !cond.any.some((ref) => readFlag(flags, ref))) return false;
  if (cond.none && cond.none.some((ref) => readFlag(flags, ref))) return false;

  if (cond.clues && !cond.clues.every((id) => clues.includes(id))) return false;
  if (cond.noClues && cond.noClues.some((id) => clues.includes(id))) return false;

  return true;
}

/** 合并状态变量写入（互斥与阈值由剧本和验收负责，引擎不猜） */
export function applyFlags(flags: Flags, patch?: Partial<Flags>): Flags {
  if (!patch) return flags;
  return { ...flags, ...patch } as Flags;
}
