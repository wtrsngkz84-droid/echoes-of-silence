# TECHNICAL — 《沉默的回声》技术架构说明

> 维护人：开发 / 技术负责人。版本：v0.2。日期：2026-11-14。
> 本文件描述实际实现的架构、数据接口、状态变量、存档方案与验证方式。
> 重大架构变更必须更新本文件并在 docs/QODER_DEV_LOG.md 留痕。
> v0.2：对齐 P-014（GAMEPLAY_DESIGN §7.1 五结局判定矩阵 + v_* 数值变量 + EV 证据编号）。

## 1. 技术栈与运行方式

| 项 | 当前 |
| --- | --- |
| 框架 | React 19 + TypeScript 5.9（strict） |
| 构建 | Vite 7（`base: './'` 支持静态部署任意路径） |
| 测试 | Vitest 3（纯逻辑单元测试，无 DOM 依赖） |
| 样式 | 纯 CSS（5 个模块：base / pixel / scene / game / screens） |
| 存储 | LocalStorage（无后端，B-002） |
| 游戏引擎 | 自研节点推进引擎（src/engine，零 React 依赖） |

```bash
npm install        # 安装依赖
npm run dev        # 本地开发（Vite）
npm test           # 运行全部单元测试
npm run build      # 类型检查 + 生产构建（输出 dist/）
npm run preview    # 本地预览构建产物
```

## 2. 三层架构（B-003：剧情数据与引擎分离）

```
src/
├── engine/    引擎层（纯 TS，无 React/DOM 依赖）
│   ├── types.ts        全部类型定义（节点/选项/状态/线索/结局）
│   ├── conditions.ts    条件求值（flag 真值 / ! 取反 / v_* 数值比较 / 线索）
│   ├── engine.ts        节点推进、选项、聊天播放、章节启动
│   ├── endings.ts       结局判定（GAMEPLAY_DESIGN §7.1 五结局矩阵）
│   └── validation.ts    剧情数据入库校验（goto/线索/章起点完整性）
├── story/     剧情数据层（改台词不改代码）
│   ├── index.ts         剧情注册表（唯一入口：STORY_INDEX）
│   ├── characters.ts / clues.ts / endings.ts
│   └── placeholder/     M0 测试占位剧情（isPlaceholder=true）
├── state/     状态层
│   ├── GameContext.tsx  useReducer 封装（run 结算/存档/图鉴/通关失效）
│   └── save.ts          LocalStorage 单槽位存档（v2）
├── components/ UI 层（screens / dialogue / chat / clue / menu / stage / ui）
├── hooks/     useTypewriter（打字机）/ useKeyboard（Space/Esc/数字键）
└── styles/    像素风 CSS
```

依赖方向：`components → state → engine ← story`。引擎不 import 剧情数据，剧情数据不 import 引擎实现（仅类型）。新增章节 = 在 `story/index.ts` 注册节点数组，不改引擎。

## 3. 节点数据接口（P-014 定稿版）

```ts
interface StoryNode {
  id: string;              // C{章}-{序号三位}，如 C1-005（STORY_FLOW 两位编号补零）；子节点 C1-0N{序}；M0.5 演示 C1-9xx / CE-9xx
  chapter: 'ch1'|'ch2'|'ch3'|'epilogue';
  beat?: string;           // 节拍号，如 B1-5（STORY_FLOW §2）
  kind: 'narration'|'dialogue'|'inner'|'chat'|'clue'|'settlement'|'ending';
  scene?: SceneKey;        // 场景背景（暖/冷色调由 tone 驱动）
  tone?: 'warm'|'cold'|'neutral';   // STORY_BIBLE §7 色调基调（D10 前暖黄，D12 起冷灰蓝）
  speaker?: CharacterId;   // dialogue 必填
  text?: string;           // 非 chat 节点必填（ending 可空）
  messages?: ChatMessage[]; // chat 节点必填，逐条点击播放；支持消息级 requires 变体演出
  chatTitle?: string;      // 群名/私聊对象名
  options?: StoryOption[]; // 玩家选择（chat 节点播完消息后也显示）
  goto?: string;           // 无选项节点的后继
  effects?: FlagPatch;     // 进入节点写入的状态变量
  clueId?: string;         // 本节点产出的证据 id（EV-xx）
  endingNote?: string;     // 结局节点备注（结局 id 由引擎求值，不由剧本指定）
  factRefs?: string[];     // 引用的 STORY_BIBLE 证据编号（EV-xx）与原文编号（§5-A~L）
  title?: string;          // 场景大标题（章节引子/日期）
  isPlaceholder?: boolean; // 测试占位标记：UI 显示徽章，正式剧本禁用
}

interface StoryOption {
  id: string;              // 节点号-O{序号}，如 C1-005-O2
  text: string;
  goto: string;
  requires?: Condition;   // 不满足则隐藏（支持 flag / v_* 比较 / 线索混合条件）
  effects?: FlagPatch;    // 选择后写入
  hint?: string;           // 选项旁提示小字
}

interface Condition {
  all?: string[];   // 引用语法见下；全部为真
  any?: string[];   // 空数组视为通过
  none?: string[];  // 全部为假
  clues?: string[];  // 全部已收集的证据 id（EV-xx）
  noClues?: string[]; // 全部未收集的证据 id（EV-xx）
}
```

**条件引用语法**（conditions.ts）：
- `'flag'` 真值判断（0、''、false、undefined 为假）；`'!flag'` 取反。
- `'v_xm_help>=2'` 数值比较（支持 `>= <= > < = == !=`；变量缺省按 0）；`'!v_xm_help>=2'` 对比较结果取反。比较语法可在 all/any/none 中与真值引用混用。

引擎保证：同一节点重复进入不重复收集线索/访问记录；条件不满足的选项不可被程序性选择（抛错拦截）；chat 消息级 `requires` 支持同一节点演出不同变体；chat 节点携带 options 时先播完消息再显示选项（GameScreen showChoices 门控）。

**多步行动窗口模式**（纯数据实现，C1-009）：枢纽节点选项 goto 回自身；同名选项用互斥 `requires`（`none: ['v_did_*']` + 比较语法）控制菜单随状态增减，重复选择写入 `v_did_*` 临时标记防重复——不依赖任何引擎改动。

**截图消息**（`kind: 'screenshot'`）：消息附件直接呈现原始聊天画面（迷你聊天窗：角标 + 状态栏时间 + 窗口名 + 原文气泡），替代文字描述。用于呈现 STORY_BIBLE 中拍屏/截取的消息（如 EV-02 裁剪版截图：仅含 20:33 一条）。`ScreenshotContent.header` 为截图内聊天窗口名、`statusTime` 为拍屏时刻、`rows` 为截图中可见的消息行（方向保留原聊天中的语义）。消息本身仍保留 `text` 字段作为无障碍回退文本。

## 4. 状态变量与结局判定（GAMEPLAY_DESIGN §5 / §7.1，P-014）

扁平 `flags` 对象，变量命名与产品文档一致。**4 个判定变量**（数值型）：

| 变量 | 含义 | 取值 |
| --- | --- | --- |
| `v_xm_help` | 小满求助达成度 | 0 谁也不找 · 1 告诉妈妈或等陈屿未果 · 2 向李老师交证据 · 3 = 2 + 完整告诉妈妈（多步窗口取最高档） |
| `v_zy_duty` | 予安责任轨迹 | −1 加码压制 · 0 无行动 · 1 部分 · 2 自首担责全项 |
| `v_cy_act` | 陈屿行动等级 | 0–3（作证/交证据/公开发声） |
| `v_cy_echo` | 跟风负面标记 | 0 / 1（E5 否决条件） |

另有 13 个调味变量（`v_xm_read_zhou`、`v_xm_variant`、`v_xm_stay`、`v_xm_openness`、`v_xm_ask_cy`、`v_mom_alert` 等，详见 GAMEPLAY_DESIGN §5）与剧本临时标记（`v_did_*`），只影响演出变体与回声小结文案，不参与结局判定。

结局判定 `evaluateEnding(flags)` 实现 GAMEPLAY_DESIGN §7.1 短路矩阵（**判定顺序 E5→E4→E3→E1→E2，E2 兜底；与结局质量排序 E5>E4>E3>E2>E1 是两个概念**）：

```
1. E5 回声      v_xm_help>=2 且 v_zy_duty=2 且 v_cy_act>=2 且 v_cy_echo=0
2. E4 责任的重量 v_zy_duty=2（未命中 E5 时；v_cy_echo=1 封顶 E4）
3. E3 再次求助   v_xm_help>=2（未命中 E4/E5 时）
4. E1 沉默的代价 v_xm_help=0 且 v_zy_duty<=0 且 v_cy_act=0
5. E2 及时止损   其余全部组合（兜底）
```

变量缺省按 0 处理——4×4×4×2 = 128 个组合全部可表驱动枚举（engine.test.ts 与 §7.1 独立重述逐一比对，五个结局均可达）。判定变量元数据从 `endings.ts` 导出的 `JUDGEMENT_VARS` 读取（结局卡展示与测试共用单一来源）。

## 5. 存档方案（B-002 / P-014）

| Key | 内容 |
| --- | --- |
| `eos.save.v2` | 当前一局 RunState（章节、当前节点、flags、证据、已访问节点）——单槽位 |
| `eos.meta.v2` | 全局图鉴：结局图鉴 `endingsSeen`（E1–E5）、证据图鉴 `clueLog`（EV-xx）、章节解锁、firstRunCompleted |

- 信封格式 `{ version: 2, updatedAt, data }`；`version !== 2` 或 JSON 解析失败按无存档处理（旧 v1 双槽位档无真实用户，不做迁移）。
- 自动存档时机：节点变化即写盘（`GameContext.persist`）；Storage 不可用/超限时静默失败，内存态不受影响。
- **通关即失效**：进入 ending 节点时清除单局存档（`clearRun`）并置 `hasSave: false`——避免「继续游戏」把已结束的一局拉回结局卡。结局与证据图鉴仍保留在 meta 中。
- 跨局合并：证据图鉴、结局图鉴在 `meta` 全局共享。

## 6. 校验与测试

- `validateStory`：正式剧本入库前必须通过（error 阻断：goto 断裂/缺 text/messages/speaker/线索不存在/章节起点缺失/screenshot 消息缺截图内容；warning：节点 id 命名偏离三位约定）。开发模式在控制台输出。
- 单元测试 41 项：条件求值（真值/取反/组合/线索/**v_* 数值比较语法**）、结局判定（E1–E5 各命中分支 + **128 组合表驱动枚举**与 §7.1 独立重述逐一比对）、节点推进（effects/线索去重/选项拦截/聊天过滤/截图内容校验）、存档（单槽位覆盖/通关失效/损坏 JSON/静默失败）、剧情数据完整性（占位标记/角色引用/EV 编号/五结局卡）。
- 浏览器实测（2026-11-14，M0.5 P-014 对齐后）：标题→内容提示→序章→汇报课（§5-A 逐字）→办公室→私聊之夜（§5-C 十条逐字 + EV-01）→群聊之夜（裁剪截图单行 20:33 + §5-E/F 围攻）→§5-G 完整自证→CP2 退群→缺席日（§5-I）→图书角→求助窗口→公示→回声小结→C1-901 演示网关→E4/E5 结局卡（判定矩阵输入展示正确）；存档注入恢复→E5 结算→通关后存档清除/继续游戏禁用/图鉴记录（E4+E5）；530px 窄视口几何实测（顶栏/聊天窗/选项列表无重叠，选项列表压缩后不裁剪）。控制台零报错。
- M0 审查 3 个 UI 问题修复：530px 顶栏徽章压缩聊天窗（两档 @media 缩小）、聊天窗新消息提示（`● 新消息 ×N · 点击播放`）、结局卡判定输入展示改用引擎 `JUDGEMENT_VARS` 单一来源。另修复：走廊场景装饰「红榜」（v0.1 遗留）改「公告栏」（12/7 公示载体）。

## 7. 当前实现范围与边界

- **已实现（M0.5，P-014 对齐）**：引擎全量功能（对话/内心/旁白/聊天/选项/线索/数值比较条件/五结局矩阵/单槽位存档/校验）+ 第1章完整弧线占位切片（11/26 汇报课→11/27 群聊之夜→11/30 缺席日→12/1–12/3 冷暴力蒙太奇→12/4 图书角→12/5–12/7 求助窗口多步枢纽→12/7 公示→回声小结，约 60 节点，§5-A~L 逐字原文，V0.95 事实零保留 v0.1）+ C1-901 结局演示网关（5 走向覆盖矩阵演示）。
- **待产品交付后接入**：正式剧本（STORY_SCRIPT，替换 placeholder/）、第 2/3 章注册（M1/M2）、群聊玩家发言深度（PRD-TBD-02 定稿后启用 chat 节点内 right 消息交互）、章节解锁链与回声入口 UI（M2）、FR-13 三分钟路径（M2+）、像素字库与正式美术资源（ASSET_LIST）。
- **引擎设计已预留**：`settlement` 节点类型（章末结算）、`clues` 条件（线索门控选项）、meta 图鉴（结局图鉴/证据图鉴页）。

## 8. 变更记录

- 2026-11-12 v0.1：初稿。M0 竖切片交付：三层架构、节点接口、三轴变量映射、双槽位存档、校验器、33 项测试。
- 2026-11-14 v0.2：P-014 对齐。结局判定改 GAMEPLAY_DESIGN §7.1 五结局矩阵（E5→E4→E3→E1→E2）；状态变量迁移 v_* 数值体系并新增比较条件语法；factRefs 改 EV-xx/§5-X；节点编号统一三位（NODE_ID_RE 收紧，无字母后缀）；存档改单槽位 v2 + 通关失效；占位剧情全量重写为 V0.95 事实基准；测试 41 项（含 128 组合表驱动）。
