import type { EndingDef } from '../engine/types';

/**
 * 四结局定义（STORY_FLOW §4）。name 为产品定稿名称；
 * description 为占位文案，正式结局卡文案待 STORY_SCRIPT 尾声节定稿。
 */
export const ENDINGS: Record<string, EndingDef> = {
  timely: {
    id: 'timely',
    name: '及时止损',
    description:
      '真相或求助在伤害定型之前送达。周一的红榜没有被涂黑，第二波风暴没有来。（占位文案，待 STORY_SCRIPT 定稿）',
    tone: 'good',
  },
  responsibility: {
    id: 'responsibility',
    name: '责任的重量',
    description:
      '伤害已经发生，但周予安在证据面前完整承认，当众澄清，承担处分。修复是起点，不是完成。（占位文案，待 STORY_SCRIPT 定稿）',
    tone: 'bittersweet',
  },
  again: {
    id: 'again',
    name: '再次求助',
    description:
      '第一次求助没有被好好接住，但第二次有了回应。霸凌被处理了，只是有些东西回不到从前。（占位文案，待 STORY_SCRIPT 定稿）',
    tone: 'bittersweet',
  },
  silence: {
    id: 'silence',
    name: '沉默的代价',
    description:
      '没人开口，没人出手，没人认领。靠制度兜底，真相才迟到地闭合。那一周的代价，已经全额支付。（占位文案，待 STORY_SCRIPT 定稿）',
    tone: 'heavy',
  },
};

export const ENDING_LIST: EndingDef[] = Object.values(ENDINGS);
