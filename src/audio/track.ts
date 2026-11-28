import type { RunState, ScreenId } from '../engine/types';

export type BgmKey = 'menu' | 'ch1' | 'ch2' | 'ch3';

/** 页面/章节 → BGM 轨。3 分钟路径按 S1/S2/S3/S4 段落切章，S5 与结局回 menu。 */
export function trackForScreen(screen: ScreenId, run: RunState | null): BgmKey {
  if (screen !== 'game' || !run) return 'menu';

  if (run.chapter === '3min') {
    const id = run.currentNodeId;
    if (id.startsWith('S1')) return 'ch1';
    if (id.startsWith('S2')) return 'ch2';
    if (id.startsWith('S3') || id.startsWith('S4')) return 'ch3';
    return 'menu';
  }

  if (run.chapter === 'ch1') return 'ch1';
  if (run.chapter === 'ch2') return 'ch2';
  if (run.chapter === 'ch3') return 'ch3';
  return 'menu';
}