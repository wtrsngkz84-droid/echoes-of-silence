import { describe, expect, it } from 'vitest';
import {
  closeViewer,
  createViewerState,
  openViewer,
  toggleViewerMode,
} from './screenshotViewerState';

describe('截图查看器状态', () => {
  it('裁剪图默认 cropped，完整记录类默认 full，初始关闭', () => {
    expect(createViewerState(true)).toEqual({ open: false, mode: 'cropped' });
    expect(createViewerState(false)).toEqual({ open: false, mode: 'full' });
  });

  it('打开后可切换裁剪图/完整上下文，关闭后不再切换', () => {
    let state = openViewer(createViewerState(true));
    expect(state.open).toBe(true);
    expect(state.mode).toBe('cropped');

    state = toggleViewerMode(state);
    expect(state.mode).toBe('full');
    state = toggleViewerMode(state);
    expect(state.mode).toBe('cropped');

    state = closeViewer(state);
    expect(state.open).toBe(false);
    expect(toggleViewerMode(state)).toBe(state);
  });

  it('未打开时 toggle 不改变状态', () => {
    const state = createViewerState(true);
    expect(toggleViewerMode(state)).toBe(state);
  });
});
