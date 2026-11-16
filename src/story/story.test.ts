import { describe, expect, it } from 'vitest';
import { STORY_INDEX, storyIssues } from './index';
import { buildChapterSummary } from './ch1Summary';
import { CLUES } from './clues';
import { ENDINGS } from './endings';
import { CHARACTERS } from './characters';
import { hasBlockingIssues } from '../engine/validation';

function allText(): string {
  const parts: string[] = [];
  for (const node of STORY_INDEX.nodes.values()) {
    if (node.text) parts.push(node.text);
    for (const variant of node.variants ?? []) parts.push(variant.text);
    for (const msg of node.messages ?? []) parts.push(msg.text);
    if (node.typing) parts.push(node.typing.draft, node.typing.final);
  }
  return parts.join('\n');
}

describe('剧情数据完整性', () => {
  it('正式剧本通过校验，无阻断问题', () => {
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

  it('正式剧本不得携带 isPlaceholder 标记', () => {
    for (const node of STORY_INDEX.nodes.values()) {
      expect(node.isPlaceholder, `${node.id} 仍带占位标记`).toBeUndefined();
    }
  });

  it('C1-005 群消息段启用 autoFlood，裁剪截图带完整上下文与 4 处断口', () => {
    const node = STORY_INDEX.nodes.get('C1-005');
    expect(node?.autoFlood).toBe(true);
    expect(node?.floodFrom).toBe(7);
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

  it('C1-006 后接入 C1-063 打字又删掉节点，并进入妈妈对话', () => {
    const before = STORY_INDEX.nodes.get('C1-006');
    const typing = STORY_INDEX.nodes.get('C1-063');
    expect(before?.goto).toBe('C1-061');
    expect(typing?.kind).toBe('typing');
    expect(typing?.typing?.draft).toContain('是我没做好');
    expect(typing?.typing?.final).toBe('');
    expect(typing?.goto).toBe('C1-064');
  });

  it('关键原文逐字包含（STORY_BIBLE §5-A/B/C/E/F/G/H/I/J/K）', () => {
    const text = allText();

    expect(text).toContain(
      '这一次『永安老街』组的成果是全班完成度最高的——尤其是文本部分。林小满——（笑）——是不是你偷偷当了主力呀？好家伙，咱班藏了个笔杆子。这样，这个报告我想送去参加这届『城市记忆』评选，申报表周五前交到我这里。',
    );

    expect(text).toContain(
      '李老师，申报表上……可以附一页分工说明吗？我想把每个人的工作都写清楚——予安的组长、汇报和 PPT，晓芸的访谈，陈屿的摄影和排版，还有我做的那部分。我不想漏掉任何人。另外，PPT 和汇报是予安独立完成的，能不能在材料里写明是她的成果？',
    );
    expect(text).toContain('可以，这个建议很好。就这么附。');

    const privateChat = [
      '小满 在吗',
      '今天老师说要把报告送去参加「城市记忆」评比了诶！我们组也太牛了',
      '对了 申报表上「主要完成人」那栏 我准备填我的名字。汇报是我讲的 PPT 也是我做的 下个月学生会换届我要竞选部长 这个校级奖对我真的很重要',
      '你这次先让让我 以后有的是机会好不好？算我欠你一个人情',
      '汇报确实是你讲的 你讲得真的很好 PPT 也做得漂亮',
      '可是报告的思路和大部分内容是我写的 老师推荐送评的也是报告本身',
      '我觉得不该只填一个名字。表上不是有「成员分工」栏吗 我们把每个人的真实分工都写上去 你的组长和汇报排在第一个 谁的贡献都不会被漏掉 这样对大家都公平',
      '行 我知道了',
      '予安 我没有想抢你的意思。你们跑了三趟老街 联系管委会预约 都是你在弄 我都记得',
    ];
    for (const line of privateChat) expect(text).toContain(line);

    expect(text).toContain(
      '汇报是我讲的 PPT 是我做的 练了十六遍。现在她私聊跟我说 报告的思路和大部分内容是她写的。大家评评理 这算什么？',
    );
    expect(text).toContain(
      '还有 她周四放学专门去办公室找了李老师。说了什么 大家自己想。',
    );

    const groupAttack = [
      '？这就是传说中的学婊吗',
      '我早觉得她有问题 转学生嘛 抱着老师大腿',
      '组长辛苦讲汇报 有人在台下递刀子 [吃瓜]',
      '会不会有误会啊 就一段截图……',
      '哟 圣母出来了 帮她洗地的排队挂号哈',
    ];
    for (const line of groupAttack) expect(text).toContain(line);

    expect(text).toContain(
      '这是昨晚的完整记录。予安 你只截了我一句话。我说了「你的组长和汇报排在第一个 谁的贡献都不会被漏掉」 也说了「我没有想抢你的意思」——这些你都截掉了。',
    );
    expect(text).toContain('我没有要抢任何人的东西。分工表上每个人的名字我都要保住，包括你的。');

    expect(text).toContain(
      '投稿：初二 3 班有人抢组员成果还会装可怜，截图为证，大家认清楚。抱着老师大腿的转学生罢了。',
    );
    expect(text).toContain(
      '听说有的组为一张申报表闹得不愉快。都要评优选先的人了，『团结』两个字怎么写，不用我再教了吧。',
    );
    expect(text).toContain(
      '本组成果归属公示：林小满 100%，其余组员 0%。——『报告的思路和大部分内容是我写的』',
    );
    expect(text).toContain('我不信那张截图。但我不敢在群里说。——对不起。');
  });

  it('C1-010 摘要按状态渲染，四条路径的关键行完整', () => {
    const defaultLines = buildChapterSummary({
      v_xm_variant: 0,
      v_xm_stay: 0,
      v_did_mom: 1,
      v_xm_ask_cy: 1,
      v_did_teacher: 1,
      v_xm_help: 3,
    }).map((line) => line.text);
    expect(defaultLines).toContain('妈妈知道了全部。');
    expect(defaultLines).toContain('她敲了办公室的门。李老师收下了全部材料。');
    expect(defaultLines).not.toContain(
      '十二天，她把所有东西都收在帆布包里，没有交出去。',
    );

    const silentLines = buildChapterSummary({
      v_xm_variant: 3,
      v_xm_stay: 1,
      v_xm_help: 0,
    }).map((line) => line.text);
    expect(silentLines.some((line) => line.includes('她留在群里，一句话也没有说'))).toBe(true);
    expect(silentLines).toContain(
      '十二天，她把所有东西都收在帆布包里，没有交出去。',
    );

    const regretLines = buildChapterSummary({
      v_xm_variant: 0,
      v_xm_stay: 0,
      v_xm_help: 2,
      v_did_teacher: 1,
    }).map((line) => line.text);
    expect(regretLines).toContain('她敲了办公室的门。李老师收下了全部材料。');
  });
});
