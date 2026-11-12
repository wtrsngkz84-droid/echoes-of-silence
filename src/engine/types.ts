/**
 * 剧情引擎类型定义 — 《沉默的回声》
 *
 * 节点数据结构提案（对应 STORY_FLOW.md §7，接口待产品确认后写入 DEV_HANDOFF）：
 * - 节点：C{章}{序号三位}，如 C1-007；尾声 CE-01
 * - 选项：节点号-O{序号}，如 C1-007-O2
 * - factRefs 引用 STORY_BIBLE 的 F 编号客观事实，供一致性校验
 */

export type ChapterId = 'ch1' | 'ch2' | 'ch3' | 'epilogue';

export type SceneKey =
  | 'home-night'
  | 'classroom'
  | 'classroom-afternoon'
  | 'classroom-cold'
  | 'hallway'
  | 'canteen';

/** 场景色调基调（STORY_BIBLE §7：D10 前暖黄，D12 起冷灰蓝） */
export type ToneKey = 'warm' | 'cold' | 'neutral';

export type NodeKind =
  | 'narration'   // 旁白/场景转换
  | 'dialogue'    // 角色台词
  | 'inner'       // 内心独白
  | 'chat'        // 手机聊天演出（群聊/私聊）
  | 'clue'        // 线索获得演出
  | 'settlement'  // 章末结算（M1）
  | 'ending';     // 结局判定点：读取 flags 求值并展示结局卡

/** 状态变量（STORY_FLOW §3 三轴字典；详见 TECHNICAL.md） */
export type FlagValue = boolean | number | string;
export type Flags = Record<string, FlagValue>;
export type FlagPatch = Partial<Record<string, FlagValue>>;

/** 条件表达式：flag 名以 '!' 前缀表示取反 */
export interface Condition {
  /** 全部为真 */
  all?: string[];
  /** 任一为真（空数组视为通过） */
  any?: string[];
  /** 全部为假 */
  none?: string[];
  /** 全部已收集的线索 id */
  clues?: string[];
  /** 全部未收集的线索 id */
  noClues?: string[];
}

export type ChatSide = 'left' | 'right' | 'system';

/** 截图内的单行消息；side 保留原聊天中的方向（left=对方，right=截图手机主人） */
export interface ScreenshotRow {
  side: ChatSide;
  text: string;
  time?: string;
}

/** 聊天截图内容（如 F-14a 裁剪版截图）：在消息内直接呈现原始聊天画面 */
export interface ScreenshotContent {
  /** 截图内聊天窗口标题（如私聊对象名） */
  header: string;
  /** 截图状态栏时间（截图拍摄时刻，如"20:44"） */
  statusTime?: string;
  /** 截图角标说明 */
  caption?: string;
  rows: ScreenshotRow[];
}

export interface ChatMessage {
  id: string;
  side: ChatSide;
  /** 发送者角色 id（system 消息可为空） */
  sender?: string;
  text: string;
  /** 消息内时间戳，如 "12:10" */
  time?: string;
  kind?: 'text' | 'image' | 'screenshot';
  /** kind=image 时的占位图说明（正式像素资源到位后替换） */
  imageCaption?: string;
  /** kind=screenshot 时的截图内容 */
  screenshot?: ScreenshotContent;
  /** 条件消息：不满足时该消息不播放（群聊变体演出用） */
  requires?: Condition;
}

export interface StoryOption {
  id: string;
  text: string;
  goto: string;
  /** 选项显示条件；不满足时隐藏（不显示灰态） */
  requires?: Condition;
  /** 选择后的状态变量写入 */
  effects?: FlagPatch;
  /** 选项旁的小字提示（如"需要先看懂截图"） */
  hint?: string;
}

export interface StoryNode {
  id: string;
  chapter: ChapterId;
  /** 节拍号，如 B1-5（STORY_FLOW §2） */
  beat?: string;
  kind: NodeKind;
  scene?: SceneKey;
  tone?: ToneKey;
  /** 说话人角色 id（dialogue 必填） */
  speaker?: string;
  /** 台词/独白/旁白正文（chat 节点可为空） */
  text?: string;
  /** chat 节点：聊天演出序列 */
  messages?: ChatMessage[];
  /** chat 节点：界面标题（群名或私聊对象名） */
  chatTitle?: string;
  options?: StoryOption[];
  /** 无选项时的无条件后继 */
  goto?: string;
  /** 进入本节点时写入的状态变量 */
  effects?: FlagPatch;
  /** 本节点产出的线索 id */
  clueId?: string;
  /** 结局节点备注（结局 id 由引擎按 STORY_FLOW §4.1 求值，不由剧本指定） */
  endingNote?: string;
  /** 引用的客观事实编号，如 ["F-14", "F-15"] */
  factRefs?: string[];
  /** 章节引子/结算等大标题 */
  title?: string;
  /** 测试占位标记：true 时 UI 显示占位徽章，正式剧本不得携带 */
  isPlaceholder?: boolean;
}

export type EndingId = 'timely' | 'responsibility' | 'again' | 'silence';

export interface EndingDef {
  id: EndingId;
  name: string;
  /** 结局卡描述（正式文案归 STORY_SCRIPT，此字段内容标记待定稿） */
  description: string;
  /** 祝福/代价的基调色 */
  tone: 'good' | 'bittersweet' | 'heavy';
}

export interface ClueDef {
  id: string;
  name: string;
  description: string;
  /** 对应客观事实编号 */
  factRef?: string;
  /** 哪些视角可以收集到 */
  chapters: ChapterId[];
}

export interface CharacterDef {
  id: string;
  name: string;
  /** 立绘/头像配色（占位像素画用，正式资源到位后替换） */
  palette: { hair: string; skin: string; cloth: string; accent: string };
  /** 对话框名牌底色 */
  themeColor: string;
}

/** 一局游玩的状态（首通或回声各一份） */
export interface RunState {
  runId: string;
  /** 当前游玩章节（回声模式可重玩任一章） */
  chapter: ChapterId;
  currentNodeId: string;
  /** 全部状态变量（三轴 + 临时） */
  flags: Flags;
  /** chat 节点内已播放的消息数 */
  chatPlayed: number;
  /** 本局收集的线索 id */
  clues: string[];
  visitedNodes: string[];
  /** 是否回声模式（不覆盖首通存档，PRD 提案 D） */
  isEcho: boolean;
}

/** 跨局持久化的进度图鉴（结局图鉴/线索图鉴/章节解锁，全局共享） */
export interface ProgressMeta {
  firstRunCompleted: boolean;
  unlockedChapters: ChapterId[];
  endingsSeen: EndingId[];
  /** 线索图鉴：任意局中收集过的线索 */
  clueLog: string[];
}

export type ScreenId = 'title' | 'warning' | 'game' | 'ending';

/** 剧情注册表：节点索引 + 各章起始节点（M0 仅注册已完成的章节切片） */
export interface StoryIndex {
  nodes: Map<string, StoryNode>;
  chapterStarts: Partial<Record<ChapterId, string>>;
}
