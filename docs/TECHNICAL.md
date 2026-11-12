# TECHNICAL — 《沉默的回声》技术架构说明

> 维护人：开发 / 技术负责人。版本：v0.1。日期：2026-11-12。
> 本文件描述实际实现的架构、数据接口、状态变量、存档方案与验证方式。
> 重大架构变更必须更新本文件并在 docs/QODER_DEV_LOG.md 留痕。

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
│   ├── conditions.ts    条件求值（flag 真值 + ! 取反 + 线索）
│   ├── engine.ts        节点推进、选项、聊天播放、章节启动
│   ├── endings.ts       结局判定（STORY_FLOW §4.1 伪代码的直接实现）
│   └── validation.ts    剧情数据入库校验（goto/线索/章起点完整性）
├── story/     剧情数据层（改台词不改代码）
│   ├── index.ts         剧情注册表（唯一入口：STORY_INDEX）
│   ├── characters.ts / clues.ts / endings.ts
│   └── placeholder/     M0 测试占位剧情（isPlaceholder=true）
├── state/     状态层
│   ├── GameContext.tsx  useReducer 封装（run 结算/存档/图鉴）
│   └── save.ts          LocalStorage 双槽位存档
├── components/ UI 层（screens / dialogue / chat / clue / menu / stage / ui）
├── hooks/     useTypewriter（打字机）/ useKeyboard（Space/Esc/数字键）
└── styles/    像素风 CSS
```

依赖方向：`components → state → engine ← story`。引擎不 import 剧情数据，剧情数据不 import 引擎实现（仅类型）。新增章节 = 在 `story/index.ts` 注册节点数组，不改引擎。

## 3. 节点数据接口（STORY_FLOW §7 提案的实现版，待产品确认后写入 DEV_HANDOFF）

```ts
interface StoryNode {
  id: string;              // C{章}{序号三位}，如 C1-007；尾声 CE-01；M0 演示 CE-9xx
  chapter: 'ch1'|'ch2'|'ch3'|'epilogue';
  beat?: string;           // 节拍号，如 B1-5（STORY_FLOW §2）
  kind: 'narration'|'dialogue'|'inner'|'chat'|'clue'|'settlement'|'ending';
  scene?: SceneKey;        // 场景背景（暖/冷色调由 tone 驱动）
  tone?: 'warm'|'cold'|'neutral';   // STORY_BIBLE §7 色调基调
  speaker?: CharacterId;   // dialogue 必填
  text?: string;           // 非 chat 节点必填（ending 可空）
  messages?: ChatMessage[]; // chat 节点必填，逐条点击播放
  chatTitle?: string;      // 群名/私聊对象名
  options?: StoryOption[]; // 玩家选择
  goto?: string;           // 无选项节点的后继
  effects?: FlagPatch;     // 进入节点写入的状态变量
  clueId?: string;         // 本节点产出的线索
  factRefs?: string[];     // 引用的 STORY_BIBLE F 编号（一致性校验用）
  title?: string;          // 场景大标题（章节引子）
  isPlaceholder?: boolean; // 测试占位标记：UI 显示徽章，正式剧本禁用
}

interface StoryOption {
  id: string;              // 节点号-O{序号}，如 C1-007-O2
  text: string;
  goto: string;
  requires?: Condition;   // 不满足则隐藏（支持 flag 与线索混合条件）
  effects?: FlagPatch;    // 选择后写入
  hint?: string;           // 选项旁提示小字
}

interface Condition {
  all?: string[];   // flag 引用，'!name' 取反；0/''/false/undefined 为假
  any?: string[];   // 空数组视为通过
  none?: string[];
  clues?: string[];  // 全部已收集
  noClues?: string[]; // 全部未收集
}
```

引擎保证：同一节点重复进入不重复收集线索/访问记录；条件不满足的选项不可被程序性选择（抛错拦截）；chat 消息级 `requires` 支持同一节点演出不同变体。

**截图消息**（`kind: 'screenshot'`）：消息附件直接呈现原始聊天画面（迷你聊天窗：角标 + 状态栏时间 + 窗口名 + 原文气泡），替代文字描述。用于呈现 STORY_BIBLE 中拍屏/截取的消息（如 F-14a 裁剪版截图）。`ScreenshotContent.header` 为截图内聊天窗口名、`statusTime` 为拍屏时刻、`rows` 为截图中可见的消息行（方向保留原聊天中的语义）。消息本身仍保留 `text` 字段作为无障碍回退文本。

## 4. 状态变量（STORY_FLOW §3 字典）

扁平 `flags` 对象，三轴变量命名与产品文档一致：

| 轴 | 变量 |
| --- | --- |
| 福祉轴（第1章） | `W_evidence` / `W_support` / `W_asked_early` / `W_asked_again` / `W_first_failed`（及 M0 临时变量 `W_reacted_confused`） |
| 责任轴（第2章） | `R_level`（0/1/2）/ `R_fueled` |
| 干预轴（第3章） | `S_early` / `S_late` / `S_privacy_cost` / `S_followed` |

结局判定 `evaluateEnding(flags)` 严格实现 STORY_FLOW §4.1：

```
S2 = S_early OR W_asked_early → 及时止损
R2 = (R_level == 2)          → 责任的重量
S1 = W_asked_again OR S_late → 再次求助
else                          → 沉默的代价
```

变量缺省按假处理——支持 STORY_BIBLE §2.4 的"默认值兜底"（玩家未触发时剧情不卡死，由剧本层 D16 兜底节点承接）。回声内部互不引用三轴，仅结局判定时汇聚（§2.4 规则 2）。

## 5. 存档方案（B-002 / PRD 提案 D）

| Key | 内容 |
| --- | --- |
| `eos.save.main.v1` | 首通 RunState（章节、当前节点、flags、线索、已访问节点） |
| `eos.save.echo.v1` | 回声模式 RunState（不覆盖首通记录） |
| `eos.meta.v1` | 全局图鉴：结局图鉴 `endingsSeen`、线索图鉴 `clueLog`、章节解锁 |

- 信封格式 `{ version, updatedAt, data }`；`version !== 1` 或 JSON 解析失败按无存档处理（未来迁移在此扩展）。
- 自动存档时机：节点变化即写盘（`GameContext.persist`）；Storage 不可用/超限时静默失败，内存态不受影响。
- 跨局合并：线索图鉴、结局图鉴在 `meta` 全局共享（STORY_FLOW §5"线索保留已收集状态"）。

## 6. 校验与测试

- `validateStory`：正式剧本入库前必须通过（error 阻断：goto 断裂/缺 text/messages/speaker/线索不存在/章节起点缺失；warning：节点 id 命名偏离约定）。开发模式在控制台输出。
- 单元测试 34 项：条件求值（flag 取反/组合/线索混合）、结局判定（4 结局 + 优先级 + 缺省兜底）、节点推进（effects/线索去重/选项拦截/聊天过滤/截图内容校验）、存档（双槽位隔离/损坏 JSON/静默失败）、剧情数据完整性（占位标记/角色引用/F 编号）。
- 浏览器实测（2026-11-12，M0 全流程）：标题→内容提示→序章→私聊演出→群聊爆发→B1-1 四分支→5 结局演示→重载恢复存档→线索面板→菜单。发现并修复：小视口标题页脚覆盖按钮（改文档流 + clamp 缩放）。

## 7. 当前实现范围与边界

- **已实现（M0）**：引擎全量功能（对话/内心/旁白/聊天/选项/线索/条件/结局判定/存档/校验）+ 第1章占位竖切片（序章回溯 6 节点 + D12 群聊爆发 + B1-1 四分支 + 结局演示网关）。
- **待产品交付后接入**：正式剧本（STORY_SCRIPT，替换 placeholder/）、群聊玩家发言深度（PRD-TBD-02 定稿后启用 chat 节点内 right 消息交互）、章节解锁链与回声入口 UI（M2）、快进（P1）、像素字库与正式美术资源（ASSET_LIST）。
- **引擎设计已预留**：`settlement` 节点类型（章末结算）、`clues` 条件（线索门控选项）、双槽位存档（回声模式）、meta 图鉴（结局图鉴/线索图鉴页）。

## 8. 变更记录

- 2026-11-12 v0.1：初稿。M0 竖切片交付：三层架构、节点接口、三轴变量映射、双槽位存档、校验器、33 项测试。
