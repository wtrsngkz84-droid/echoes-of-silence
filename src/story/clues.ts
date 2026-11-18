import type { ClueDef } from '../engine/types';

/**
 * 证据定义。id 与 factRef 均对应 STORY_BIBLE §4 的 EV-xx 编号。
 * 当前为第一章（小满侧）可收集子集；其余证据随第二/三章剧情数据交付扩充。
 */
export const CLUES: Record<string, ClueDef> = {
  'EV-01': {
    id: 'EV-01',
    name: '完整的私聊记录',
    description:
      '你和周予安 11/26 晚的完整对话。20:31 的肯定、20:36 的分工方案、20:58 的和解——每一句都在你的手机里。',
    factRef: 'EV-01',
    chapters: ['ch1', 'ch2', 'ch3'],
  },
  'EV-02': {
    id: 'EV-02',
    name: '裁剪截图与指控帖',
    description:
      '群里的截图只有你 20:33 发的那一句，配上「大家评评理」和「她专门去办公室找了老师」。截图里没有一个字是假的——假的是被裁掉的部分。',
    factRef: 'EV-02',
    chapters: ['ch1', 'ch2', 'ch3'],
  },
  'EV-04': {
    id: 'EV-04',
    name: '老街走访照片',
    description:
      '陈屿相机里的老街、时间水印和小满走访记录的那天。照片能证明的事，比说出来的多。',
    factRef: 'EV-04',
    chapters: ['ch1', 'ch3'],
  },
  'EV-05': {
    id: 'EV-05',
    name: '办公室谈话',
    description:
      '11/26 放学后，小满请李老师附一页分工说明，并把「PPT 和汇报是予安独立完成的」写进材料。陈屿在门外听到了全部。',
    factRef: 'EV-05',
    chapters: ['ch1', 'ch3'],
  },
  'EV-08': {
    id: 'EV-08',
    name: '女生小群预告截图',
    description:
      '12/1 晚，郑晓芸在女生小群说「明天给她来个『成果公示』怎么样」。12/2 纸条真的出现。',
    factRef: 'EV-08',
    chapters: ['ch3'],
  },
  'EV-06': {
    id: 'EV-06',
    name: '公示的分工说明页',
    description:
      '12/7 公告栏上的分工说明：周予安（组长/汇报/PPT）、林小满（报告执笔/走访/访谈整理）、郑晓芸（部分访谈）、陈屿（摄影/排版）。纸能澄清事实，不能自动澄清人心。',
    factRef: 'EV-06',
    chapters: ['ch1', 'ch2', 'ch3'],
  },
  'EV-03': {
    id: 'EV-03',
    name: '蓝色帆布草稿本',
    description: '六版带日期的提纲，11/12–11/24。报告主体，是你一笔一笔写出来的。',
    factRef: 'EV-03',
    chapters: ['ch1'],
  },
  'EV-09': {
    id: 'EV-09',
    name: '匿名纸条',
    description:
      '「我不信那张截图。但我不敢在群里说。——对不起。」不知道是谁写的。知道有人不信，就够了。',
    factRef: 'EV-09',
    chapters: ['ch1', 'ch3'],
  },
  'EV-10': {
    id: 'EV-10',
    name: '值日表照片',
    description: '值日表上，你的名字被人划掉了。旁边一行小字：「她反正也不来」。',
    factRef: 'EV-10',
    chapters: ['ch1', 'ch2', 'ch3'],
  },
  'EV-11': {
    id: 'EV-11',
    name: '成果归属表纸条',
    description:
      '「本组成果归属公示：林小满 100%，其余组员 0%。」你把它揉皱，又展平，收进了帆布包。',
    factRef: 'EV-11',
    chapters: ['ch1'],
  },
};

export const CLUE_LIST: ClueDef[] = Object.values(CLUES);
