import type { EndingDef } from '../engine/types';

/**
 * 五结局定义（STORY_BIBLE §12 / GAMEPLAY_DESIGN §7）。
 * 结局 id 由引擎判定矩阵求值，不由剧本指定；description 为 §12 核心画面的占位呈现，
 * 正式结局卡文案待 STORY_SCRIPT 尾声节定稿。
 */
export const ENDINGS: Record<string, EndingDef> = {
  E1: {
    id: 'E1',
    name: '沉默的代价',
    description:
      '学期末，小满转学，座位第二次空出来。予安赢得了竞选；树洞帖渐渐无人记得。速写本的最后一页是空椅子，角落一行小字：「对不起，我删掉了那句话。」',
    tone: 'heavy',
  },
  E2: {
    id: 'E2',
    name: '及时止损',
    description:
      '谣言澄清了，责任却没有落定。小满留了下来，只是上课不再举手。班级学到的唯一一句话是：「别再闹大。」',
    tone: 'bittersweet',
  },
  E3: {
    id: 'E3',
    name: '再次求助',
    description:
      '处理落地。小满把帆布包放回桌上，给妈妈发消息：「妈，今天我想跟你说个事」——打字，删掉，再打，发送。',
    tone: 'bittersweet',
  },
  E4: {
    id: 'E4',
    name: '责任的重量',
    description:
      '予安把完整对话的原图发进群里，再把 20:58 那条单独发出来，然后私下道歉、一张张揭下竞选海报。小满说：「我接受你的道歉。但我不想现在原谅你——这两件事不冲突。」',
    tone: 'bittersweet',
  },
  E5: {
    id: 'E5',
    name: '回声',
    description:
      '班会后，公告栏多出一面自发的匿名道歉墙：「当时我转发了」「我没说话」「对不起」。空椅子归还。小满坐了回去：「椅子我坐回来了。剩下的，慢慢来。」陈屿第一个鼓掌。',
    tone: 'good',
  },
};

export const ENDING_LIST: EndingDef[] = Object.values(ENDINGS);
