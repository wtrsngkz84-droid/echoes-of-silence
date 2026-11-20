import type { EndingId, Flags } from './types';

/**
 * 结局判定 — GAMEPLAY_DESIGN §7.1（STORY_BIBLE §12，对齐提案 P-014）。
 *
 * 判定变量仅 4 个（缺省按 0）：
 *   v_xm_help  小满求助达成度 0–3
 *   v_zy_duty  予安责任轨迹 -1..+2
 *   v_cy_act   陈屿行动等级 0–3
 *   v_cy_echo  跟风负面标记 0–1
 *
 * 判定顺序（短路，首个命中即结局；E2 为兜底，任何组合必落且仅落一个结局）：
 *   1. E5 回声      v_xm_help>=2 且 v_zy_duty=2 且 v_cy_act>=2 且 v_cy_echo=0
 *   2. E4 责任的重量 v_zy_duty=2（且未命中 E5；v_cy_echo=1 时封顶 E4）
 *   3. E3 再次求助   v_xm_help>=2（且未命中 E4/E5）
 *   4. E1 沉默的代价 v_xm_help=0 且 v_zy_duty<=0 且 v_cy_act=0
 *   5. E2 及时止损   其余全部组合
 */
export function evaluateEnding(flags: Flags): EndingId {
  return evaluateEndingWithPrefix(flags);
}

/** 3 分钟路径使用同一矩阵，读取 3min_ 前缀变量。 */
export function evaluateEndingWithPrefix(flags: Flags, prefix = ''): EndingId {
  const help = numeric(flags, `${prefix}v_xm_help`);
  const duty = numeric(flags, `${prefix}v_zy_duty`);
  const act = numeric(flags, `${prefix}v_cy_act`);
  const echo = numeric(flags, `${prefix}v_cy_echo`);

  if (help >= 2 && duty === 2 && act >= 2 && echo === 0) return 'E5';
  if (duty === 2) return 'E4';
  if (help >= 2) return 'E3';
  if (help === 0 && duty <= 0 && act === 0) return 'E1';
  return 'E2';
}

/** 判定变量元数据：结局卡展示与表驱动测试共用 */
export const JUDGEMENT_VARS: ReadonlyArray<{ key: string; label: string; min: number; max: number }> = [
  { key: 'v_xm_help', label: '小满求助', min: 0, max: 3 },
  { key: 'v_zy_duty', label: '予安责任', min: -1, max: 2 },
  { key: 'v_cy_act', label: '陈屿行动', min: 0, max: 3 },
  { key: 'v_cy_echo', label: '跟风标记', min: 0, max: 1 },
];

function numeric(flags: Flags, key: string): number {
  const raw = flags[key];
  if (typeof raw === 'number') return raw;
  if (raw === true) return 1;
  return 0;
}
