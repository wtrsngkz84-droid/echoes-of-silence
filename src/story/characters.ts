import type { CharacterDef } from '../engine/types';

/**
 * 角色定义（STORY_BIBLE §4）。
 * palette 为占位像素立绘配色，正式像素资源按 ASSET_LIST 到位后原位替换。
 */
export const CHARACTERS: Record<string, CharacterDef> = {
  xiaoman: {
    id: 'xiaoman',
    name: '林小满',
    palette: { hair: '#3d2b3f', skin: '#f2cfae', cloth: '#7a9e6b', accent: '#e8b04b' },
    themeColor: '#7a9e6b',
  },
  yuAn: {
    id: 'yuAn',
    name: '周予安',
    palette: { hair: '#2b2b33', skin: '#e8bd98', cloth: '#5d6b8c', accent: '#8c6b4a' },
    themeColor: '#5d6b8c',
  },
  chenyu: {
    id: 'chenyu',
    name: '陈屿',
    palette: { hair: '#4a3826', skin: '#f0cba8', cloth: '#6b7f8c', accent: '#9db4c0' },
    themeColor: '#6b7f8c',
  },
  fangqing: {
    id: 'fangqing',
    name: '方晴',
    palette: { hair: '#6b3a2a', skin: '#f5d3b0', cloth: '#c97a8c', accent: '#e8a04b' },
    themeColor: '#c97a8c',
  },
  gaoxiang: {
    id: 'gaoxiang',
    name: '高翔',
    palette: { hair: '#1f1f24', skin: '#e2b58e', cloth: '#a8524a', accent: '#d9c04b' },
    themeColor: '#a8524a',
  },
  liTeacher: {
    id: 'liTeacher',
    name: '李老师',
    palette: { hair: '#40342c', skin: '#f0cba8', cloth: '#8c7a5d', accent: '#4a6b5d' },
    themeColor: '#8c7a5d',
  },
  jianlan: {
    id: 'jianlan',
    name: '简蓝',
    palette: { hair: '#22344b', skin: '#f2cfae', cloth: '#4a7ab5', accent: '#8cc0e8' },
    themeColor: '#4a7ab5',
  },
  classmateA: {
    id: 'classmateA',
    name: '同学A',
    palette: { hair: '#555', skin: '#e8c8a8', cloth: '#999', accent: '#bbb' },
    themeColor: '#999999',
  },
  classmateB: {
    id: 'classmateB',
    name: '同学B',
    palette: { hair: '#666', skin: '#e0c0a0', cloth: '#888', accent: '#aaa' },
    themeColor: '#888888',
  },
};

export function characterName(id?: string): string {
  if (!id) return '';
  return CHARACTERS[id]?.name ?? id;
}
