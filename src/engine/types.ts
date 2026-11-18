/**
 * 剧情引擎类型定义 — 《沉默的回声》
 *
 * 数据接口以产品 P2 定稿为准（STORY_BIBLE V0.95 / STORY_FLOW V0.9 / GAMEPLAY_DESIGN V0.9，
 * 对齐提案 PROJECT_DECISIONS P-014）：
 * - 节点：C{章}-{序号三位}，如 C1-005；STORY_FLOW 设计稿的两位编号（C1-05）在数据层统一补零为三位
 * - 状态变量：v_* 命名（GAMEPLAY_DESIGN §5：4 判定变量 + 13 调味变量）
 * - factRefs 引用 STORY_BIBLE 的 EV-01~EV-11 证据编号与 §5-A~L 原文编号
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
  | 'call'        // 电话演出（C2-003）
  | 'composer'    // 输入框发送/删除（C3-002 / GAMEPLAY_DESIGN §3.4）
  | 'crop'        // 裁剪交互（C2-004 / GAMEPLAY_DESIGN §3.3）
  | 'reasoning'   // 推理指认（GAMEPLAY_DESIGN §4.3）
  | 'checklist'   // 担责清单（C2-008）
  | 'typing'      // 「打字又删掉」输入框演出（GAMEPLAY_DESIGN §2.3）
  | 'summary'     // 章末小结屏（C1-010/C2-009）
  | 'clue'        // 线索获得演出
  | 'settlement'  // 章末结算（M1）
  | 'ending';     // 结局判定点：读取 flags 求值并展示结局卡

/** 状态变量（GAMEPLAY_DESIGN §5：v_* 四判定变量 + 13 调味变量；详见 TECHNICAL.md） */
export type FlagValue = boolean | number | string;
export type Flags = Record<string, FlagValue>;
export type FlagPatch = Partial<Record<string, FlagValue>>;

/**
 * 条件表达式。引用语法：
 * - 'flag' 真值判断（0、''、false、undefined 视为假）；'!flag' 取反
 * - 'v_xm_help>=2' 数值比较（支持 >=、<=、>、<、=、==、!=；变量缺省按 0）
 */
export interface Condition {
  /** 全部为真 */
  all?: string[];
  /** 任一为真（空数组视为通过） */
  any?: string[];
  /** 全部为假 */
  none?: string[];
  /** 全部已收集的证据 id（EV-xx） */
  clues?: string[];
  /** 全部未收集的证据 id（EV-xx） */
  noClues?: string[];
}

export type ChatSide = 'left' | 'right' | 'system';

/** 截图内的单行消息；side 保留原聊天中的方向（left=对方，right=截图手机主人） */
export interface ScreenshotRow {
  side: ChatSide;
  text: string;
  time?: string;
  /** 该条在公开裁剪图中被裁掉（GAMEPLAY_DESIGN §3.2 撕裂断口标记） */
  cropped?: boolean;
}

/** 截图内容：在消息内直接呈现原始聊天画面，点击进入查看器 */
export interface ScreenshotContent {
  /** 截图内聊天窗口标题（如私聊对象名） */
  header: string;
  /** 截图状态栏时间（截图拍摄时刻，如"20:44"） */
  statusTime?: string;
  /** 截图角标说明 */
  caption?: string;
  rows: ScreenshotRow[];
  /** 完整记录（EV-01）：裁剪截图「查看完整上下文」的数据源 */
  fullContext?: ScreenshotRow[];
}

/** 条件文本变体：首个满足条件的 variant 覆盖 node.text */
export interface NodeVariant {
  requires: Condition;
  text: string;
}

export interface CallLine {
  speaker?: string;
  text: string;
  time?: string;
}

/** 电话演出（C2-003）：来电人头 + 语音字幕 */
export interface CallContent {
  caller: string;
  lines: CallLine[];
}

/** 输入框发送/删除（C3-002） */
export interface ComposerContent {
  candidates: string[];
  sendEffects?: FlagPatch;
  deleteEffects?: FlagPatch;
}

/** 裁剪交互（C2-004）：九条完整私聊 + 目标条 + 错误反馈 */
export interface CropContent {
  messages: ScreenshotRow[];
  targetIndex: number;
  wrongFeedback: Record<number, string>;
  defaultCaption: string;
  softGuideAfter?: number;
}

export interface ReasoningCandidate {
  id: string;
  text: string;
  correct?: boolean;
}

/** 推理指认（C2-006 / GAMEPLAY_DESIGN §4.3） */
export interface ReasoningContent {
  prompt: string;
  clues: string[];
  candidates: ReasoningCandidate[];
  wrongFeedback: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
}

/** 担责清单（C2-008）：全选 duty=2，任一放弃 duty=1 */
export interface ChecklistContent {
  prompt: string;
  items: ChecklistItem[];
  clock?: string;
  /** 全选时写入的状态（由数据层定义） */
  fullEffects?: FlagPatch;
  /** 部分选择时写入的状态（由数据层定义） */
  partialEffects?: FlagPatch;
}

/** 「打字又删掉」演出参数（GAMEPLAY_DESIGN §2.3） */
export interface TypingEffect {
  /** 草稿层长文：逐字浮现后逐字消隐 */
  draft: string;
  /** 定格最终文案（可为空字符串，表示输入框最终留空） */
  final: string;
  /** 逐字浮现间隔，默认 45ms */
  typeMs?: number;
  /** 逐字消隐间隔，默认 28ms */
  deleteMs?: number;
  /** 草稿浮现完成后的停顿，默认 700ms */
  holdMs?: number;
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
  /** 玩家向的代价标签（GD §3.5，第三章菜单用） */
  price?: string;
}

export interface StoryNode {
  id: string;
  chapter: ChapterId;
  /** 场景节拍/日期锚点，如 '群聊之夜 11/27' */
  beat?: string;
  kind: NodeKind;
  scene?: SceneKey;
  tone?: ToneKey;
  /** 说话人角色 id（dialogue 必填） */
  speaker?: string;
  /** 台词/独白/旁白正文（chat/typing 节点可为空） */
  text?: string;
  /** 条件文本变体：首个 requires 满足的条目覆盖 text */
  variants?: NodeVariant[];
  /** chat 节点：聊天演出序列 */
  messages?: ChatMessage[];
  /** chat 节点：界面标题（群名或私聊对象名） */
  chatTitle?: string;
  /** chat 节点：指定消息索引起自动上涌（GAMEPLAY_DESIGN §3.1；首遍不可跳过） */
  autoFlood?: boolean;
  /** autoFlood 起始消息索引，默认 0 */
  floodFrom?: number;
  /** autoFlood 每条消息间隔毫秒，默认 420；2× 时减半 */
  floodIntervalMs?: number;
  /** typing 节点：「打字又删掉」演出参数 */
  typing?: TypingEffect;
  /** call 节点：电话内容 */
  call?: CallContent;
  /** composer 节点：输入框候选句与发送/删除效果 */
  composer?: ComposerContent;
  /** crop 节点：裁剪交互内容 */
  crop?: CropContent;
  /** reasoning 节点：推理指认内容 */
  reasoning?: ReasoningContent;
  /** checklist 节点：担责清单内容 */
  checklist?: ChecklistContent;
  options?: StoryOption[];
  /** 无选项时的无条件后继 */
  goto?: string;
  /** 进入本节点时写入的状态变量 */
  effects?: FlagPatch;
  /** 本节点产出的证据 id（EV-xx） */
  clueId?: string;
  /** 结局节点备注（结局 id 由引擎按 GAMEPLAY_DESIGN §7.1 求值，不由剧本指定） */
  endingNote?: string;
  /** 引用的证据/原文编号，如 ["EV-01", "§5-C"] */
  factRefs?: string[];
  /** 章节引子/结算等大标题 */
  title?: string;
  /** 测试占位标记：true 时 UI 显示占位徽章，正式剧本不得携带 */
  isPlaceholder?: boolean;
}

/**
 * 结局 id（STORY_BIBLE §12 / GAMEPLAY_DESIGN §7）：
 * E1 沉默的代价 / E2 及时止损 / E3 再次求助 / E4 责任的重量 / E5 回声。
 * 注意：判定顺序 E5→E4→E3→E1→E2（E2 兜底），与结局质量排序是两个概念。
 */
export type EndingId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';

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
  /** 对应 STORY_BIBLE 证据编号（EV-xx）或原文编号（§5-X） */
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

/** 一局游玩的状态（完整体验单槽位；3 分钟路径命名空间随 FR-13/M2 落地） */
export interface RunState {
  runId: string;
  /** 当前游玩章节（通关后可从任一章重开，FR-09） */
  chapter: ChapterId;
  currentNodeId: string;
  /** 全部状态变量（v_* 判定/调味变量 + 临时标记） */
  flags: Flags;
  /** chat 节点内已播放的消息数 */
  chatPlayed: number;
  /** 本局收集的证据 id（EV-xx） */
  clues: string[];
  visitedNodes: string[];
  /** 第三章「已删除的消息」存档；旧档缺失按空数组处理 */
  deletedMessages?: string[];
}

/** 跨局持久化的进度图鉴（结局图鉴/证据图鉴/章节解锁，全局共享） */
export interface ProgressMeta {
  firstRunCompleted: boolean;
  unlockedChapters: ChapterId[];
  endingsSeen: EndingId[];
  /** 证据图鉴：任意局中收集过的证据 */
  clueLog: string[];
  /** 已完成的章节（章节回顾，旧档缺失按空数组） */
  completedChapters?: ChapterId[];
  /** 最近一次章末状态，供「携带重玩」（v_did_* 已过滤） */
  carriedFlags?: Flags;
}

export type ScreenId = 'title' | 'warning' | 'game' | 'ending';

/** 剧情注册表：节点索引 + 各章起始节点（M0 仅注册已完成的章节切片） */
export interface StoryIndex {
  nodes: Map<string, StoryNode>;
  chapterStarts: Partial<Record<ChapterId, string>>;
}
