import type { Condition, Flags, FlagValue, RunState } from './types';

const COMPARISON_RE = /^([A-Za-z_]\w*)(>=|<=|==|!=|>|<|=)(-?\d+(?:\.\d+)?)$/;

function truthy(raw: FlagValue | undefined): boolean {
  return raw !== undefined && raw !== false && raw !== 0 && raw !== '';
}

function toNumber(raw: FlagValue | undefined): number {
  if (typeof raw === 'number') return raw;
  if (raw === true) return 1;
  if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  return 0;
}

function compare(left: number, op: string, right: number): boolean {
  switch (op) {
    case '>=':
      return left >= right;
    case '<=':
      return left <= right;
    case '>':
      return left > right;
    case '<':
      return left < right;
    case '=':
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    default:
      return false;
  }
}

/**
 * 单条引用求值。语法（详见 types.ts Condition 注释）：
 * - 'flag' / '!flag'：真值判断（0、''、false、undefined 视为假）
 * - 'v_xm_help>=2'：数值比较（变量缺省按 0）；'!' 前缀对比较结果取反
 */
export function readFlag(flags: Flags, ref: string): boolean {
  const negated = ref.startsWith('!');
  const body = negated ? ref.slice(1) : ref;

  const comparison = COMPARISON_RE.exec(body);
  let result: boolean;
  if (comparison) {
    result = compare(toNumber(flags[comparison[1]]), comparison[2], Number(comparison[3]));
  } else {
    result = truthy(flags[body]);
  }
  return negated ? !result : result;
}

/** 组合条件求值（flag + 证据） */
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
