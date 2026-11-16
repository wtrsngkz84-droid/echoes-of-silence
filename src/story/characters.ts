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
  luoYiming: {
    id: 'luoYiming',
    name: '罗一鸣',
    palette: { hair: '#3f3f46', skin: '#e8c8a8', cloth: '#5d6b7a', accent: '#9aa7b4' },
    themeColor: '#9aa7b4',
  },
  happyDuck: {
    id: 'happyDuck',
    name: '今天也要开心鸭',
    palette: { hair: '#6b5b3f', skin: '#e8c8a8', cloth: '#a08a5a', accent: '#d9c27a' },
    themeColor: '#d9c27a',
  },
  lemon: {
    id: 'lemon',
    name: '极速柠檬',
    palette: { hair: '#4f4a2f', skin: '#e8c8a8', cloth: '#8a8a4f', accent: '#c9d16b' },
    themeColor: '#c9d16b',
  },
  candy: {
    id: 'candy',
    name: '一颗奶糖',
    palette: { hair: '#5a4a3f', skin: '#f0d0b0', cloth: '#b08a8a', accent: '#e0b4b4' },
    themeColor: '#e0b4b4',
  },
  chips: {
    id: 'chips',
    name: '海盐薯片',
    palette: { hair: '#4a4a55', skin: '#e8c8a8', cloth: '#7a8a9a', accent: '#a8c0d0' },
    themeColor: '#a8c0d0',
  },
  cha: {
    id: 'cha',
    name: '路过的猹',
    palette: { hair: '#4f4f4f', skin: '#e0c0a0', cloth: '#8a8a7a', accent: '#b8b8a0' },
    themeColor: '#b8b8a0',
  },
};

export function characterName(id?: string): string {
  if (!id) return '';
  return CHARACTERS[id]?.name ?? id;
}
