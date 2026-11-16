import type { Flags } from '../engine/types';

export interface SummaryEntry {
  id: string;
  text: string;
}

export const CHAPTER_SUMMARY_COUNTDOWN =
  '距 12/12 学生会答辩：4 天。距 12/14 班会：6 天。';
export const CHAPTER_SUMMARY_GUIDE = '下一章，你会从另一个位置，重新经过同一周。';

function numeric(flags: Flags, key: string): number {
  const raw = flags[key];
  if (typeof raw === 'number') return raw;
  if (raw === true) return 1;
  if (typeof raw === 'string' && raw.trim() !== '' && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  return 0;
}

function truthy(flags: Flags, key: string): boolean {
  const raw = flags[key];
  return raw !== undefined && raw !== false && raw !== 0 && raw !== '';
}

/** C1-010 摘要渲染表：只陈述、不评判。 */
export function buildChapterSummary(flags: Flags): SummaryEntry[] {
  const lines: SummaryEntry[] = [];

  if ('v_xm_variant' in flags) {
    const variant = numeric(flags, 'v_xm_variant');
    const text = [
      '她在群里贴出了完整的记录。',
      '她把那晚的话，用文字说了一遍。',
      '她私信了予安，问了一句为什么。没有等到回音。',
      '她什么都没有发。她把一切都保存了下来。',
    ][variant];
    if (text) lines.push({ id: 'variant', text });
  }

  if ('v_xm_stay' in flags) {
    lines.push({
      id: 'stay',
      text:
        numeric(flags, 'v_xm_stay') === 0
          ? '那天夜里，她退出了班级群。'
          : '那天夜里，她留在群里，一句话也没有说。',
    });
  }

  if (truthy(flags, 'v_did_mom')) {
    lines.push({ id: 'mom', text: '妈妈知道了全部。' });
  } else if (numeric(flags, 'v_mom_alert') === 1) {
    lines.push({ id: 'mom-half', text: '她跟妈妈说了一半。' });
  }

  if (truthy(flags, 'v_xm_ask_cy')) {
    lines.push({ id: 'ask-cy', text: '她的请求，还没有等到回应。' });
  }

  if (truthy(flags, 'v_did_teacher')) {
    lines.push({ id: 'teacher', text: '她敲了办公室的门。李老师收下了全部材料。' });
  }

  if (numeric(flags, 'v_xm_help') === 0) {
    lines.push({
      id: 'help-zero',
      text: '十二天，她把所有东西都收在帆布包里，没有交出去。',
    });
  }

  return lines;
}
