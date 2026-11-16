/**
 * 群聊自动上涌状态机（GAMEPLAY_DESIGN §3.1）。
 *
 * 纯 TS、无 DOM/计时器依赖：由 UI 按 floodIntervalMs 驱动 tickFlood，
 * 由这里的规则保证「首遍不可跳过」——状态机不提供 skip/revealAll。
 * 暂停/恢复与 1×/2× 加速是玩家唯一可用的控制。
 */

export type FloodStatus = 'idle' | 'playing' | 'paused' | 'done';
export type FloodSpeed = 1 | 2;

export interface FloodState {
  status: FloodStatus;
  revealed: number;
  total: number;
  speed: FloodSpeed;
}

export const DEFAULT_FLOOD_INTERVAL_MS = 420;
const MIN_FLOOD_INTERVAL_MS = 80;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTotal(total: number): number {
  return Math.max(0, Math.floor(total));
}

export function createFloodState(total: number, revealed = 0): FloodState {
  const safeTotal = normalizeTotal(total);
  const safeRevealed = clamp(Math.floor(revealed), 0, safeTotal);
  return {
    status: safeRevealed >= safeTotal ? 'done' : 'idle',
    revealed: safeRevealed,
    total: safeTotal,
    speed: 1,
  };
}

/** 外部（手动点击/存档恢复）推进 revealed 后同步状态；暂停态保持不变。 */
export function syncFloodState(state: FloodState, revealed: number, total: number): FloodState {
  const safeTotal = normalizeTotal(total);
  const safeRevealed = clamp(Math.floor(revealed), 0, safeTotal);
  if (safeRevealed >= safeTotal) {
    return { ...state, status: 'done', revealed: safeRevealed, total: safeTotal };
  }
  if (state.status === 'done') {
    return { ...state, status: 'idle', revealed: safeRevealed, total: safeTotal };
  }
  return { ...state, revealed: safeRevealed, total: safeTotal };
}

export function startFlood(state: FloodState): FloodState {
  if (state.total <= 0 || state.revealed >= state.total) {
    return { ...state, status: 'done' };
  }
  if (state.status !== 'idle') return state;
  return { ...state, status: 'playing' };
}

export function tickFlood(state: FloodState): FloodState {
  if (state.status !== 'playing') return state;
  const revealed = Math.min(state.total, state.revealed + 1);
  return {
    ...state,
    revealed,
    status: revealed >= state.total ? 'done' : 'playing',
  };
}

export function toggleFloodPause(state: FloodState): FloodState {
  if (state.status === 'done') return state;
  return {
    ...state,
    status: state.status === 'playing' ? 'paused' : 'playing',
  };
}

export function setFloodSpeed(state: FloodState, speed: FloodSpeed): FloodState {
  return { ...state, speed };
}

export function floodIntervalMs(
  state: FloodState,
  baseMs = DEFAULT_FLOOD_INTERVAL_MS,
): number {
  return Math.max(MIN_FLOOD_INTERVAL_MS, Math.round(baseMs / state.speed));
}
