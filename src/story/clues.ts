import type { ClueDef } from '../engine/types';

/**
 * 线索定义。factRef 对应 STORY_BIBLE 的 F 编号客观事实。
 * M0 切片线索 3 条；正式章节线索随 STORY_SCRIPT / GAMEPLAY_DESIGN 交付后扩充。
 */
export const CLUES: Record<string, ClueDef> = {
  'clue-red-banner': {
    id: 'clue-red-banner',
    name: '只印了第一作者的红榜',
    description: '市级评选报送署名是四个人，红榜上却只有"林小满等同学"。你在榜前站了很久。',
    factRef: 'F-10',
    chapters: ['ch1'],
  },
  'clue-full-chat': {
    id: 'clue-full-chat',
    name: '完整的私聊记录',
    description:
      '你手机里存着和陈屿的完整对话：那句"紧张的"后面，跟着"予安熬的三个通宵我都记着"。',
    factRef: 'F-12',
    chapters: ['ch1', 'ch3'],
  },
  'clue-cropped-screenshot': {
    id: 'clue-cropped-screenshot',
    name: '被裁剪的截图',
    description:
      '群里流传的截图只有你 20:42 发的那一条。后面的解释、自责和那句"给视频署个大大的名"，全都不见了。',
    factRef: 'F-14a',
    chapters: ['ch1', 'ch2', 'ch3'],
  },
};

export const CLUE_LIST: ClueDef[] = Object.values(CLUES);
