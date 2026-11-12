import type { ClueDef, StoryNode } from './types';

export interface ValidationIssue {
  level: 'error' | 'warning';
  nodeId: string;
  message: string;
}

const NODE_ID_RE = /^C[123E]-\d{3}$/;

/**
 * 剧情数据入库校验：正式剧本交付时必须先通过本校验。
 * error = 阻断（引用断裂、缺字段）；warning = 规范偏离（命名等）。
 */
export function validateStory(
  nodes: StoryNode[],
  clues: ClueDef[],
  chapterStarts: Record<string, string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const clueIds = new Set(clues.map((c) => c.id));

  for (const node of nodes) {
    if (ids.has(node.id)) {
      issues.push({ level: 'error', nodeId: node.id, message: '节点 id 重复' });
    }
    ids.add(node.id);
  }

  for (const node of nodes) {
    const where = node.id;

    if (!NODE_ID_RE.test(node.id)) {
      issues.push({
        level: 'warning',
        nodeId: where,
        message: `节点 id 不符合 C{章}{序号三位} 约定（STORY_FLOW §7）`,
      });
    }

    // ending 节点由引擎按 flags 求值展示，无台词、无选项、无后继
    if (node.kind === 'ending') continue;

    if (node.kind === 'chat') {
      if (!node.messages || node.messages.length === 0) {
        issues.push({ level: 'error', nodeId: where, message: 'chat 节点缺少 messages' });
      }
      const msgIds = new Set<string>();
      for (const msg of node.messages ?? []) {
        if (msgIds.has(msg.id)) {
          issues.push({ level: 'error', nodeId: where, message: `消息 id 重复：${msg.id}` });
        }
        msgIds.add(msg.id);
        if (msg.kind === 'screenshot' && (!msg.screenshot || msg.screenshot.rows.length === 0)) {
          issues.push({
            level: 'error',
            nodeId: where,
            message: `screenshot 消息缺少截图内容：${msg.id}`,
          });
        }
      }
    } else if (!node.text) {
      issues.push({ level: 'error', nodeId: where, message: `非 chat 节点缺少 text` });
    }

    if (node.kind === 'dialogue' && !node.speaker) {
      issues.push({ level: 'error', nodeId: where, message: 'dialogue 节点缺少 speaker' });
    }

    if (node.clueId && !clueIds.has(node.clueId)) {
      issues.push({ level: 'error', nodeId: where, message: `线索不存在：${node.clueId}` });
    }

    const optionIds = new Set<string>();
    for (const option of node.options ?? []) {
      if (optionIds.has(option.id)) {
        issues.push({ level: 'error', nodeId: where, message: `选项 id 重复：${option.id}` });
      }
      optionIds.add(option.id);
      if (!option.goto) {
        issues.push({ level: 'error', nodeId: where, message: `选项缺少 goto：${option.id}` });
      } else if (!ids.has(option.goto)) {
        issues.push({ level: 'error', nodeId: where, message: `选项 goto 目标不存在：${option.goto}` });
      }
    }

    if ((node.options ?? []).length === 0 && !node.goto) {
      issues.push({ level: 'error', nodeId: where, message: '无选项节点缺少 goto（终止悬挂）' });
    }
    if (node.goto && !ids.has(node.goto)) {
      issues.push({ level: 'error', nodeId: where, message: `goto 目标不存在：${node.goto}` });
    }
  }

  for (const [chapter, startId] of Object.entries(chapterStarts)) {
    if (!ids.has(startId)) {
      issues.push({
        level: 'error',
        nodeId: startId,
        message: `章节 ${chapter} 的起始节点不存在`,
      });
    }
  }

  return issues;
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error');
}
