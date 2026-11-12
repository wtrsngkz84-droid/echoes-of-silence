import { describe, expect, it } from 'vitest';
import { STORY_INDEX, storyIssues } from './index';
import { CLUES } from './clues';
import { ENDINGS } from './endings';
import { CHARACTERS } from './characters';
import { hasBlockingIssues } from '../engine/validation';

describe('剧情数据完整性', () => {
  it('占位切片通过校验，无阻断问题', () => {
    const issues = storyIssues();
    if (issues.length > 0) console.warn('剧情数据校验输出：', issues);
    expect(hasBlockingIssues(issues)).toBe(false);
  });

  it('章节起始节点已注册', () => {
    expect(STORY_INDEX.chapterStarts.ch1).toBe('C1-001');
    expect(STORY_INDEX.nodes.get('C1-001')).toBeDefined();
  });

  it('剧情节点引用的角色已定义', () => {
    for (const node of STORY_INDEX.nodes.values()) {
      if (node.speaker) expect(CHARACTERS[node.speaker], node.id).toBeDefined();
      for (const msg of node.messages ?? []) {
        if (msg.sender) expect(CHARACTERS[msg.sender], `${node.id}/${msg.id}`).toBeDefined();
      }
    }
  });

  it('结局四张卡与引擎判定 id 一致', () => {
    expect(Object.keys(ENDINGS).sort()).toEqual(
      ['again', 'responsibility', 'silence', 'timely'].sort(),
    );
  });

  it('线索 factRef 均存在于 STORY_BIBLE 事实编号空间', () => {
    for (const clue of Object.values(CLUES)) {
      expect(clue.factRef).toMatch(/^F-\d+[a-z]?$/);
    }
  });

  it('占位节点全部携带 isPlaceholder 标记（正式剧本不得携带）', () => {
    for (const node of STORY_INDEX.nodes.values()) {
      expect(node.isPlaceholder, `${node.id} 缺少占位标记`).toBe(true);
    }
  });
});
