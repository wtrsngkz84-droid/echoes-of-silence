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

  it('结局五张卡与引擎判定 id 一致（STORY_BIBLE §12）', () => {
    expect(Object.keys(ENDINGS).sort()).toEqual(['E1', 'E2', 'E3', 'E4', 'E5']);
  });

  it('线索 factRef 均引用 STORY_BIBLE 证据编号 EV-xx', () => {
    for (const clue of Object.values(CLUES)) {
      expect(clue.factRef, clue.id).toMatch(/^EV-\d{2}$/);
    }
  });

  it('占位节点全部携带 isPlaceholder 标记（正式剧本不得携带）', () => {
    for (const node of STORY_INDEX.nodes.values()) {
      expect(node.isPlaceholder, `${node.id} 缺少占位标记`).toBe(true);
    }
  });

  it('C1-005 群消息段启用 autoFlood，裁剪截图带完整上下文与 4 处断口', () => {
    const node = STORY_INDEX.nodes.get('C1-005');
    expect(node?.autoFlood).toBe(true);
    expect(node?.floodFrom).toBe(3);
    expect(node?.floodIntervalMs).toBe(420);

    const shot = node?.messages?.find((msg) => msg.kind === 'screenshot')?.screenshot;
    expect(shot?.rows).toHaveLength(1);
    expect(shot?.rows[0].time).toBe('20:33');
    expect(shot?.fullContext).toHaveLength(9);
    expect(shot?.fullContext?.find((row) => row.time === '20:33')?.cropped).toBeFalsy();
    expect(shot?.fullContext?.filter((row) => row.cropped)).toHaveLength(4);
  });

  it('C1-051 完整记录截图标记 4 条被公开裁掉的消息', () => {
    const node = STORY_INDEX.nodes.get('C1-051');
    const shot = node?.messages?.find((msg) => msg.kind === 'screenshot')?.screenshot;
    expect(shot?.rows).toHaveLength(9);
    expect(shot?.rows.filter((row) => row.cropped)).toHaveLength(4);
    expect(shot?.fullContext).toBeUndefined();
  });

  it('C1-006 后接入 C1-060 打字又删掉节点，最终定格「妈 没事」', () => {
    const before = STORY_INDEX.nodes.get('C1-006');
    const typing = STORY_INDEX.nodes.get('C1-060');
    expect(before?.goto).toBe('C1-060');
    expect(typing?.kind).toBe('typing');
    expect(typing?.typing?.final).toBe('妈 没事');
    expect(typing?.typing?.draft.length).toBeGreaterThan(typing!.typing!.final.length);
    expect(typing?.goto).toBe('C1-061');
  });
});
