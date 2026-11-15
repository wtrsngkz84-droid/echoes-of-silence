import type { CharacterDef } from '../engine/types';

/**
 * 角色定义（STORY_BIBLE §9）。
 * palette 为占位像素立绘配色，正式像素资源按 ASSET_LIST 到位后原位替换。
 * 群像发言者使用类型化昵称（§9.6：正式昵称随 STORY_SCRIPT 定稿）。
 */
export const CHARACTERS: Record<string, CharacterDef> = {
  xiaoman: {
    id: 'xiaoman',
    name: '林小满',
    palette: { hair: '#3d2b3f', skin: '#f2cfae', cloth: '#7d92a8', accent: '#9db4c0' },
    themeColor: '#7d92a8',
  },
  yuAn: {
    id: 'yuAn',
    name: '周予安',
    palette: { hair: '#2b2b33', skin: '#e8bd98', cloth: '#a8734f', accent: '#e8a04b' },
    themeColor: '#e8a04b',
  },
  zhengXiaoyun: {
    id: 'zhengXiaoyun',
    name: '郑晓芸',
    palette: { hair: '#5a3a52', skin: '#f0cfae', cloth: '#a86b8c', accent: '#d98cb0' },
    themeColor: '#a86b8c',
  },
  chenyu: {
    id: 'chenyu',
    name: '陈屿',
    palette: { hair: '#4a3826', skin: '#f0cba8', cloth: '#6b7f8c', accent: '#9db4c0' },
    themeColor: '#6b7f8c',
  },
  liTeacher: {
    id: 'liTeacher',
    name: '李老师',
    palette: { hair: '#40342c', skin: '#f0cba8', cloth: '#8c7a5d', accent: '#4a6b5d' },
    themeColor: '#8c7a5d',
  },
  mom: {
    id: 'mom',
    name: '妈妈',
    palette: { hair: '#4a3b33', skin: '#f2cfae', cloth: '#7a8c9d', accent: '#c0b49d' },
    themeColor: '#7a8c9d',
  },
  classmateA: {
    id: 'classmateA',
    name: '起哄的同学',
    palette: { hair: '#555', skin: '#e8c8a8', cloth: '#999', accent: '#bbb' },
    themeColor: '#999999',
  },
  classmateB: {
    id: 'classmateB',
    name: '围观的同学',
    palette: { hair: '#666', skin: '#e0c0a0', cloth: '#888', accent: '#aaa' },
    themeColor: '#888888',
  },
  classmateC: {
    id: 'classmateC',
    name: '疑问的同学',
    palette: { hair: '#5c5348', skin: '#e8c8a8', cloth: '#8a8a7a', accent: '#b0b09a' },
    themeColor: '#8a8a7a',
  },
};

export function characterName(id?: string): string {
  if (!id) return '';
  return CHARACTERS[id]?.name ?? id;
}
