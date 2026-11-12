import type { EndingId, Flags } from './types';

/**
 * 结局判定 — 严格按 STORY_FLOW.md §4.1：
 *
 *   S2 = S_early OR W_asked_early     （干预/求助在 D15 前生效）
 *   R2 = (R_level == 2)
 *   S1 = W_asked_again OR S_late      （D15~D16 迟到补救）
 *
 *   if  S2 → 及时止损
 *   elif R2 → 责任的重量
 *   elif S1 → 再次求助
 *   else    → 沉默的代价
 *
 * 优先级：及时止损 > 责任的重量 > 再次求助 > 沉默的代价。
 * 求值确定、互斥、无随机；变量缺省（未设置）按假处理。
 */
export function evaluateEnding(flags: Flags): EndingId {
  const s2 = truthy(flags, 'S_early') || truthy(flags, 'W_asked_early');
  if (s2) return 'timely';

  const r2 = flags.R_level === 2;
  if (r2) return 'responsibility';

  const s1 = truthy(flags, 'W_asked_again') || truthy(flags, 'S_late');
  if (s1) return 'again';

  return 'silence';
}

function truthy(flags: Flags, key: string): boolean {
  const raw = flags[key];
  return raw !== undefined && raw !== false && raw !== 0 && raw !== '';
}
