import type { Flags } from '../engine/types';

export interface SummaryEntry {
  id: string;
  text: string;
}

export const CH2_SUMMARY_COUNTDOWN = '距离 12/14 班会，1 天。';
export const CH2_SUMMARY_GUIDE = '最后一章，你会站在离真相最近、却说得最少的位置。';

function numeric(flags: Flags, key: string): number {
  const raw = flags[key];
  if (typeof raw === 'number') return raw;
  if (raw === true) return 1;
  if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  return 0;
}

/** C2-009 摘要渲染表：只陈述、不评判。 */
export function buildChapter2Summary(flags: Flags): SummaryEntry[] {
  const lines: SummaryEntry[] = [];
  const duty = numeric(flags, 'v_zy_duty');

  if (duty === 2) {
    lines.push(
      { id: 'duty-2a', text: '12 月 12 日，她把该说的都说完了。' },
      { id: 'duty-2b', text: '名单上的名字，一个一个划掉。最后一个是她自己。' },
    );
  } else if (duty === 1) {
    lines.push(
      { id: 'duty-1a', text: '她把讲稿留在了后台。' },
      { id: 'duty-1b', text: '那句「对不起」，还躺在输入框里。' },
    );
  } else if (duty === 0) {
    lines.push(
      { id: 'duty-0a', text: '答辩照常。掌声照常。' },
      { id: 'duty-0b', text: '没有什么被说破。' },
    );
  } else if (duty === -1) {
    lines.push(
      { id: 'duty-neg-a', text: '她讲满了三分钟。' },
      { id: 'duty-neg-b', text: '群里刷过一片『予安yyds』。' },
    );
  }

  if ('v_zy_meme_stance' in flags) {
    const stance = numeric(flags, 'v_zy_meme_stance');
    const text = [
      '她说过一句「别搞了」。没有人听。',
      '表情包还在传。',
      '她转发过一条，又撤回了。撤回的灰字，没有人看见。',
    ][stance];
    if (text) lines.push({ id: 'meme', text });
  }

  const asked = numeric(flags, 'v_zy_ask_note') === 1 || numeric(flags, 'v_zy_ask_post') === 1;
  lines.push({
    id: 'ask',
    text: asked ? '她问过。答案她没有接住。' : '有些答案，她没有问。',
  });

  return lines;
}