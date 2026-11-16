/** 截图查看器开合/视图模式纯状态（组件交互测试用，不依赖 DOM）。 */

export type ViewerMode = 'cropped' | 'full';

export interface ViewerState {
  open: boolean;
  mode: ViewerMode;
}

/** 裁剪图默认从 cropped 开始；完整记录类截图直接进 full。 */
export function createViewerState(hasFullContext: boolean): ViewerState {
  return { open: false, mode: hasFullContext ? 'cropped' : 'full' };
}

export function openViewer(state: ViewerState): ViewerState {
  return { ...state, open: true };
}

export function closeViewer(state: ViewerState): ViewerState {
  return { ...state, open: false };
}

/** 在裁剪图与完整记录之间切换；未打开时不变。 */
export function toggleViewerMode(state: ViewerState): ViewerState {
  if (!state.open) return state;
  return { ...state, mode: state.mode === 'cropped' ? 'full' : 'cropped' };
}
