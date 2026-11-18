import { buildStoryIndex } from '../engine/engine';
import { hasBlockingIssues, validateStory } from '../engine/validation';
import type { ChapterId, StoryIndex } from '../engine/types';
import { CH1_NODES } from './ch1';
import { CH2_NODES } from './ch2';
import { CLUE_LIST } from './clues';

/**
 * 剧情注册表 — 唯一的剧情数据入口。
 * 新章节交付时：在此追加节点数组与 chapterStarts，勿改动引擎。
 * 当前注册：第一章正式剧本（STORY_SCRIPT V0.1）。
 */
const ALL_NODES = [...CH1_NODES, ...CH2_NODES];

const CHAPTER_STARTS: Partial<Record<ChapterId, string>> = {
  ch1: 'C1-001',
  ch2: 'C2-001',
};

export const STORY_INDEX: StoryIndex = buildStoryIndex(ALL_NODES, CHAPTER_STARTS);

/** 剧情数据校验（正式剧本入库前必须为空阻断项） */
export function storyIssues() {
  return validateStory(ALL_NODES, CLUE_LIST, CHAPTER_STARTS);
}

if (import.meta.env.DEV && hasBlockingIssues(storyIssues())) {
  console.error('[剧情数据校验] 存在阻断问题：', storyIssues());
}
