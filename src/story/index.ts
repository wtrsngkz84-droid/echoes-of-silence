import { buildStoryIndex } from '../engine/engine';
import { hasBlockingIssues, validateStory } from '../engine/validation';
import type { ChapterId, StoryIndex } from '../engine/types';
import { CLUE_LIST } from './clues';
import { CH1_SLICE_NODES } from './placeholder/ch1Slice';

/**
 * 剧情注册表 — 唯一的剧情数据入口。
 * 新章节交付时：在此追加节点数组与 chapterStarts，勿改动引擎。
 * 当前注册：M0 竖切片（占位，见 src/story/placeholder/）。
 */
const ALL_NODES = [...CH1_SLICE_NODES];

const CHAPTER_STARTS: Partial<Record<ChapterId, string>> = {
  ch1: 'C1-001',
};

export const STORY_INDEX: StoryIndex = buildStoryIndex(ALL_NODES, CHAPTER_STARTS);

/** 剧情数据校验（正式剧本入库前必须为空阻断项） */
export function storyIssues() {
  return validateStory(ALL_NODES, CLUE_LIST, CHAPTER_STARTS);
}

if (import.meta.env.DEV && hasBlockingIssues(storyIssues())) {
  console.error('[剧情数据校验] 存在阻断问题：', storyIssues());
}
