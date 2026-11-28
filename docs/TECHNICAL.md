# TECHNICAL — 《沉默的回声》技术架构说明

> 维护人：开发 / 技术负责人。版本：v0.11.3。日期：2026-11-28。
> 本文件描述实际实现的架构、数据接口、状态变量、存档方案与验证方式。
> 重大架构变更必须更新本文件并在 docs/QODER_DEV_LOG.md 留痕。
> v0.2：对齐 P-014（GAMEPLAY_DESIGN §7.1 五结局判定矩阵 + v_* 数值变量 + EV 证据编号）。
> v0.3：M1-P0 第一章核心交互——截图查看器（GAMEPLAY_DESIGN §3.2）、群聊自动上涌（§3.1）、「打字又删掉」演出（§2.3）。
> v0.4：STORY_SCRIPT V0.1 第一章正式剧本入库（C1-001～C1-010），占位切片退役；新增章末小结屏与条件文本变体。
> v0.4.1：P1/P2 清理——有存档时「开始游戏」二次确认、选项 hint 防泄露回归测试、beat 注释更新。
> v0.4.2：M1 交付审阅 4 项修复——12/5–12/6 办公室路径、C1-006 时间线、公示页选项文案、结局判定输入 dev-only。
> v0.5：M2 第二章正式剧本（C2-001～C2-009）+ 电话/裁剪/推理/担责清单组件；第三章输入框、速写本、价格标签先行；C1-901 移除，C2-901 临时网关。
> v0.6：第三章 C3-001～C3-009 入库；输入框/速写本/价格标签接线；C2-901 移除，C2-009 → C3-001；C3-008 接入正式结局卡。
> v0.7：M2 P2——章节解锁链（携带重玩/全新开始）、结局画廊、章节回顾；EndingScreen 增加画廊入口。
> v0.7.1：T-P3-4 首轮 5 项修复——C3-046 条件文案、C3-054 条件线索、推理 solvedEffects（C2/C3）、班会双重追责、散会行分叉。
> v0.8：FR-13 三分钟评审路径 S1–S5（3min_ 独立命名空间、eos_3min_v1 独立存档、标题双入口、S5 固定引导与双跳转）。
> v0.9：收尾验收——390/768/1440 三档视口自测与竖屏适配、Nudge 设计变量（`--site-*`）、测试占位标记 `isPlaceholder` 移除、Qoder Sites 公网发布与静态部署说明。
> v0.9.1：FR-13 真人走查修复——S1 四选项各自接入后果文本节点、S2 补齐 8 个非目标行反馈与点击 affordance、S3 `composer.sceneNote` 场景说明、S1–S4 主/副标题去重。
> v0.9.2：身份提示审计修复——`TypingEffect.label`（C1-063「给妈妈」/C2-083「给小满」，缺省「输入框」）、C3-021 输入框场景说明、裁剪 `headerNote`（C2-004 / 3min S2）、C2-004 全量错误反馈、C3-007 班会副行「教室 · 你的座位」。
> v0.9.3：移动端布局修复——390px 竖屏对话/聊天与选项上下堆叠、台词限高内部滚动、选项按剩余空间滚动；桌面 `display: contents` 无回归。身份提示 6 项与本次布局修复已一次性重新发布。
> v0.10.0：视觉一档——6 立绘 / 5 场景 / 2 表情包接入（缺图回退），表情包两处剧情点改为 chat 演出，EndingScreen 预留可选插画位；素材合计 1.89 MiB（≤2MB），公网重新发布。
> v0.10.1：桌面重叠修复 + 结局插画接入——有选项时 390/768/1440 统一上下堆叠；5 张结局插画接入 `public/assets/endings/` 并启用 EndingScreen 插画位；素材合计 2.20 MiB（≤2.5MB），公网重新发布。
> v0.11.0：P4 第二档——6 张神态差分（`portraitMood`）接入主线节点；4 段原创 CC0 BGM（menu/ch1/ch2/ch3，ogg+mp3、40s 无缝循环、600ms 交叉淡化、−18dB、静音记忆）；证据物小图（P2）延期。
> v0.11.1：BGM V0.3——ch1「空椅子」/ ch2「暗涌」/ ch3「余白」改为钢琴主导原创曲（参数化合成、无采样/无拼接/无外部音源）；menu 不变；同名覆盖、代码零改动；公网重新发布。
> v0.11.2：BGM 音色与演奏升级（§14.2）——三层力度钢琴、击键噪声、踏板/共鸣、高频泛音；力度 ±8%、时值 ±10ms、rubato；add9/maj7/sus 色彩和弦、14% 湿声、钢琴偏左/弦垫偏右；主织体上移中音区（C4–C6），峰值约 −3dBFS。
> v0.11.3：ch2《暗涌》定向修复（§14.3）——仅重制 ch2：八分主干（仅 2 小节十六分）、C4–D5、6.8kHz 柔和低通、无高频泛音/击键层、约 30ms 软起音、200–800Hz 中频支撑、18% 湿声；>4kHz 能量 OGG 0.03% / MP3 0.28%；ch1/ch3/menu 未改。

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

### 部署（v0.9）

- 线上地址：<https://echoes-of-silence-rwx94cwcoxm.qoder.zone>（Qoder Sites，公开访问、无需登录；完整版 + 3 分钟体验双入口）。作品要求在 Qoder Sites 公网部署，`dist/` 同时可托管于任意静态服务器。
- `vite.config.ts` 使用 `base: './'`，构建产物全部为相对资源，可直接放在任意子路径；`index.html` 单入口，无路由依赖，静态刷新返回 200。
- 发布方式：`npm run build` → 将 `dist/` 交给 Qoder Sites / 静态托管；v0.11.2 发布的 `dist` 与线上 asset 哈希一致（`index-BKDfnFDj.js` / `index-BbatdVOa.css`，SHA256 逐一比对相同；本次仅音频替换，JS/CSS 哈希不变）。
- 构建体积基线（gzip）：JS 117.15 KB、CSS 7.31 KB、HTML 0.47 KB。
- 素材体积：`public/assets/` 24 个 PNG 合计 3,255,274 bytes（3.10 MiB）；BGM 8 个文件合计 3,893,292 bytes（3.71 MiB），单段 ogg 242–442 KB、mp3 641 KB（均 <1.5MB）。

### 终端适配与设计变量（v0.9）

- 舞台保持 16:9；竖屏且宽度 ≤900px 时改为全视口（`100vw × 100vh`），避免 390px 手机竖屏下舞台过矮、标题与按钮被裁。
- 560px / 720px 两档媒体查询压缩顶栏、聊天窗与选项列表；竖屏下聊天窗与选项分别限高并可内部滚动，避免遮挡。
- 有选项时，所有视口（含 1440 桌面）统一在底部上下堆叠（`.game-bottom--choices`）：对话/聊天正文在上、选项在下，正文限高并内部滚动，选项列表按剩余空间收缩/滚动；无选项时 `.game-bottom { display: contents }` 保持原绝对定位。390px 竖屏额外压缩宽度与高度。
- 设计变量收敛在 `base.css` 的 `--site-*`（bg/fg/accent/surface/muted/border/font/radius/space/type/motion），并别名到原有 `--bg-page/--ink/...`；组件只用变量消费，便于统一调参。

## 2. 三层架构（B-003：剧情数据与引擎分离）

```
src/
├── engine/    引擎层（纯 TS，无 React/DOM 依赖）
│   ├── types.ts        全部类型定义（节点/选项/状态/线索/结局）
│   ├── conditions.ts    条件求值（flag 真值 / ! 取反 / v_* 数值比较 / 线索）
│   ├── engine.ts        节点推进、选项、聊天播放、章节启动
│   ├── flood.ts         群聊自动上涌状态机（暂停/恢复/2×；无 skip）
│   ├── endings.ts       结局判定（GAMEPLAY_DESIGN §7.1 五结局矩阵）
│   └── validation.ts    剧情数据入库校验（goto/线索/章起点/typing/autoFlood）
├── story/     剧情数据层（改台词不改代码）
│   ├── index.ts         剧情注册表（唯一入口：STORY_INDEX）
│   ├── ch1.ts           第一章正式剧本数据（STORY_SCRIPT V0.1，C1-001～C1-010）
│   ├── ch1Summary.ts    C1-010 摘要渲染表（纯函数）
│   ├── characters.ts / clues.ts / endings.ts
│   └── （M0 占位切片已退役，随 v0.3 的 placeholder 一并删除）
├── state/     状态层
│   ├── GameContext.tsx  useReducer 封装（run 结算/存档/图鉴/通关失效）
│   └── save.ts          LocalStorage 单槽位存档（v2）
├── components/ UI 层（screens / dialogue / chat / clue / menu / stage / ui）
│   ├── chat/ScreenshotViewer.tsx        截图查看器（完整上下文/撕裂断口）
│   ├── chat/screenshotViewerState.ts    查看器开合/视图模式纯状态（可单测）
│   └── dialogue/TypingDelete.tsx        「打字又删掉」演出组件
├── hooks/     useTypewriter（打字机）/ useKeyboard（Space/Esc/数字键）
└── styles/    像素风 CSS
```

依赖方向：`components → state → engine ← story`。引擎不 import 剧情数据，剧情数据不 import 引擎实现（仅类型）。新增章节 = 在 `story/index.ts` 注册节点数组，不改引擎。

## 3. 节点数据接口（P-014 定稿版）

```ts
interface StoryNode {
  id: string;              // C{章}-{序号三位}，如 C1-005（STORY_FLOW 两位编号补零）；子节点 C1-0N{序}；M0.5 演示 C1-9xx / CE-9xx
  chapter: 'ch1'|'ch2'|'ch3'|'3min'|'epilogue';
  beat?: string;           // 节拍号，如 B1-5（STORY_FLOW §2）
  kind: 'narration'|'dialogue'|'inner'|'chat'|'call'|'crop'|'reasoning'|'checklist'|'composer'|'typing'|'summary'|'clue'|'settlement'|'ending';
  scene?: SceneKey;        // 场景背景（暖/冷色调由 tone 驱动）
  tone?: 'warm'|'cold'|'neutral';   // STORY_BIBLE §7 色调基调（D10 前暖黄，D12 起冷灰蓝）
  speaker?: CharacterId;   // dialogue 必填
  portraitMood?: string;   // 立绘神态 key（hurt/hope/strained/crack/tense/resolve）
  text?: string;           // 非 chat/typing/summary 节点必填（ending 可空；variants 可替代）
  variants?: NodeVariant[]; // 条件文本变体：首个 requires 满足的条目覆盖 text
  messages?: ChatMessage[]; // chat 节点必填，逐条点击播放；支持消息级 requires 变体演出
  chatTitle?: string;      // 群名/私聊对象名
  autoFlood?: boolean;     // chat 节点：从 floodFrom 起自动上涌（GAMEPLAY_DESIGN §3.1）
  floodFrom?: number;      // 自动上涌起始消息索引，默认 0
  floodIntervalMs?: number; // 每条间隔，默认 420；2× 时减半（最小 80ms）
  typing?: TypingEffect;   // typing 节点必填：「打字又删掉」演出参数
  options?: StoryOption[]; // 玩家选择（chat 节点播完消息后也显示）
  goto?: string;           // 无选项节点的后继
  effects?: FlagPatch;     // 进入节点写入的状态变量
  clueId?: string;         // 本节点产出的证据 id（EV-xx）
  endingNote?: string;     // 结局节点备注（结局 id 由引擎求值，不由剧本指定）
  factRefs?: string[];     // 引用的 STORY_BIBLE 证据编号（EV-xx）与原文编号（§5-A~L）
  title?: string;          // 场景大标题（章节引子/日期）
}

interface StoryOption {
  id: string;              // 节点号-O{序号}，如 C1-005-O2
  text: string;
  goto: string;
  requires?: Condition;   // 不满足则隐藏（支持 flag / v_* 比较 / 线索混合条件）
  effects?: FlagPatch;    // 选择后写入
  hint?: string;           // 选项旁提示小字
  price?: string;          // 行动代价标签，如「代价 · 时间」（C3-006）
}

interface Condition {
  all?: string[];   // 引用语法见下；全部为真
  any?: string[];   // 空数组视为通过
  none?: string[];  // 全部为假
  clues?: string[];  // 全部已收集的证据 id（EV-xx）
  noClues?: string[]; // 全部未收集的证据 id（EV-xx）
}

interface TypingEffect {
  label?: string;   // 输入框上方的对象标签，如「给妈妈」；缺省「输入框」
  draft: string;    // 草稿层长文：逐字浮现后逐字消隐
  final: string;    // 定格最终文案（可为空字符串）
  typeMs?: number;  // 逐字浮现间隔，默认 45ms
  deleteMs?: number; // 逐字消隐间隔，默认 28ms
  holdMs?: number;  // 草稿完成后的停顿，默认 700ms
}

interface NodeVariant {
  requires: Condition;
  text: string;
}
```

**条件引用语法**（conditions.ts）：
- `'flag'` 真值判断（0、''、false、undefined 为假）；`'!flag'` 取反。
- `'v_xm_help>=2'` 数值比较（支持 `>= <= > < = == !=`；变量缺省按 0）；`'!v_xm_help>=2'` 对比较结果取反。比较语法可在 all/any/none 中与真值引用混用。

引擎保证：同一节点重复进入不重复收集线索/访问记录；条件不满足的选项不可被程序性选择（抛错拦截）；chat 消息级 `requires` 支持同一节点演出不同变体；chat 节点携带 options 时先播完消息再显示选项（GameScreen showChoices 门控）。

**多步行动窗口模式**（纯数据实现，C1-009）：枢纽节点选项 goto 回自身；同名选项用互斥 `requires`（`none: ['v_did_*']` + 比较语法）控制菜单随状态增减，重复选择写入 `v_did_*` 临时标记防重复——不依赖任何引擎改动。

**截图消息与查看器**（`kind: 'screenshot'`，GAMEPLAY_DESIGN §3.2）：
- `ScreenshotContent.header` 为截图内聊天窗口名、`statusTime` 为拍屏时刻、`rows` 为截图中可见的消息行（方向保留原聊天语义）。消息本身仍保留 `text` 作为无障碍回退文本。
- 点击截图卡 → 全屏查看器（`ScreenshotViewer`），可上下滚动；Esc / 点击遮罩关闭，关闭后剧情可继续。
- 裁剪截图（EV-02）提供 `fullContext: ScreenshotRow[]`，底部常驻「查看完整上下文」切换完整记录；`ScreenshotRow.cropped: true` 标记被公开裁掉的条目，查看器在每条被裁条目上方渲染撕裂断口与说明「这张图被裁掉的部分」。
- 完整记录类截图（EV-01）直接把全部 `rows` 作为滚动视图，并用 `cropped` 标记同样呈现断口。
- 查看器开合/模式切换由 `screenshotViewerState.ts` 纯函数管理，交互测试不依赖 DOM。

**群聊自动上涌**（`autoFlood`，GAMEPLAY_DESIGN §3.1）：
- `flood.ts` 是纯状态机（`idle → playing ⇄ paused → done`），不提供 skip/revealAll——首遍不可跳过；唯一控制是暂停/恢复与 1×/2×。
- `autoFloodActive(run, node)` 在 `chatPlayed >= floodFrom` 且未播完时返回 true；GameScreen 在该状态下拦截点击跳过。
- 手动点击前段消息仍可用；进入上涌段后由 PhoneChat 定时触发 `CHAT_NEXT`。聊天窗滚动到非底部时停止自动吸底，支持回滚查看已滚过内容。
- `floodFrom` 越界、`floodIntervalMs <= 0`、autoFlood 用在非 chat 节点由 validateStory 拦截/告警。

**「打字又删掉」**（`kind: 'typing'`，GAMEPLAY_DESIGN §2.3）：
- `typing.draft` 逐字浮现 → `holdMs` 停顿 → 逐字消隐 → 定格 `typing.final`（可空白）。
- 通用组件 `TypingDelete` 负责动画；动画完成前点击不推进，完成后点击/主操作进入 `goto`。
- `typing.label` 渲染输入对象（C1-063「给妈妈」、C2-083「给小满」），缺省显示「输入框」，避免跨章硬编码穿帮。
- C1-006 缺席日已接入 C1-063：长文删除后定格空白，再由 C1-064 的反应选择决定给妈妈的消息。

**交互归属提示（v0.9.2）**：
- `ComposerContent.sceneNote` 渲染输入框上方的场景说明（C3-021 与 3min S3 同文案「群聊之夜 · 陈屿侧」）。
- `CropContent.headerNote` 渲染裁剪界面的手机归属（C2-004 / 3min S2-001「11/27 夜 · 予安的手机」），由 `CropNight` 统一渲染。

**正式视觉素材（v0.10.0，P4 视觉一档）**：
- `public/assets/characters/`：6 张 768×1024 立绘（`xiaoman.png` / `yuan.png` / `chenyu.png` / `zhengxiaoyun.png` / `liteacher.png` / `mom.png`）。`PixelAvatar` 优先渲染 `<img>`（高度由 `size` 控制、`image-rendering: pixelated`），无对应文件或加载失败时回退 12×12 数据网格。
- `public/assets/scenes/`：5 张 1536×1024 场景（`classroom-warm.png` / `classroom-cold.png` / `classroom-afternoon.png` / `hallway.png` / `home-night.png`）。`SceneBackground` 按 `SceneKey` 映射 `<img>`（`object-fit: cover`），`tone-overlay` 保留；缺图或加载失败回退原 CSS 装饰。
- `public/assets/meme/`：2 张 512×512 表情包。`ChatMessage` 增加可选 `src`；`kind='image'` 且有 `src` 时渲染图片并在底部叠加 UI 文案（不烧图）。C2-006 与 C3-003 由 `narration` 改为 `chat` 演出以承载表情包，原描述文本与选项逐字保留；图片加载完成后若聊天窗处于吸底状态会自动滚到底部。
- `public/assets/endings/`：5 张 800×450 结局插画（`e1.png`～`e5.png`）。`EndingScreen` 按 endingId 映射并在卡面顶部渲染，预留 `onError` 隐藏；缺图不显示。
- 压缩：环境无 pngquant/oxipng，使用 Pillow 调色板量化（立绘 40 色、场景 32 色、表情包/结局 32 色，无抖动）+ `optimize`；18 个文件合计 2,311,560 bytes。

**神态差分（v0.11.0，ASSET_LIST §9）**：
- `public/assets/characters/{id}-{mood}.png`：`xiaoman-hurt/hope`、`yuan-strained/crack`、`chenyu-tense/resolve`（768×1024，图生图，保服装/构图/色板）。
- `StoryNode.portraitMood?: string`；`PixelAvatar` 依次尝试 `{base}-{mood}.png` → `{base}.png` → 12×12 网格；`base` 取默认立绘文件名（避免 `yuAn` 与 `yuan.png` 大小写不一致）。
- 挂点按 §9：C1-005/006/007 hurt、C1-008/010 hope、C2-003/004/005 strained、C2-007/008 crack、C3-002/004 tense、C3-006/007 resolve。
- 无 speaker 的旁白/内心节点由 mood 推导 POV 角色（hurt/hope→xiaoman、strained/crack→yuAn、tense/resolve→chenyu）。有选项时桌面立绘移至左上 9%，移动端无选项时上移至 36%，避免被对话/选项遮挡。

**章节 BGM（v0.11.0 / V0.3 / v0.11.2 音色升级，ASSET_LIST §10 / §14）**：
- `public/assets/audio/bgm/{menu,ch1,ch2,ch3}.{ogg,mp3}`：40s 无缝循环；menu 保持 2026-11-27 ambient（未改动）；ch1–ch3 为钢琴主导原创曲：ch1「空椅子」60 BPM A 小调（主织体 C4–C5，短动机+长留白）、ch2「暗涌」72 BPM D 小调（C4–D5 八分主干，仅 2 小节十六分推进 + 短低频脉冲/轻心跳；6.8kHz 柔和低通、无高频泛音/击键层、约 30ms 软起音、200–800Hz 中频支撑、18% 湿声）、ch3「余白」54 BPM C 大调（C4–E5 长音 + 轻合成弦垫，最大留白）。单段 ogg 263–381 KB、mp3 641 KB（均 <1.5MB）；授权登记见 `docs/ASSET_LIST.md` §12。
- 原创方法（§14.2 选 b）：增强参数化合成——3 个力度层（soft/mid/hard，泛音/衰减/击键差异）、击键噪声层、踏板/共鸣总线、高频泛音与空气层；力度随机 ±8%、时值 ±10ms、乐句 rubato、踏板延音；add9/maj7/sus 色彩和弦；14% 湿声、钢琴偏左/弦垫偏右；100Hz 低切、峰值约 −3dBFS。无采样、无拼接、无外部音源；不模仿既有作品旋律/主题。
- ch2 V0.3.1 定向修复（§14.3）：去掉 ch2 的 7.2/9.1/11.3 倍高频泛音、3.8kHz air 与击键噪声；琶音 6.8kHz 低通；attack 约 26–34ms；十六分只保留 2 小节推进，最高 D5；hard 力度仅 1 处转折；200–800Hz 中频支撑、18% 湿声。实测 >4kHz 能量 OGG 0.03% / MP3 0.28%，200–800Hz 约 78%，母带峰值 −3dBFS；ch1/ch3/menu 未改。
- `src/audio/track.ts`：页面/章节 → BGM key（标题/警告/结局/画廊/回顾 → menu；完整版按 chapter；3min S1→ch1、S2→ch2、S3/S4→ch3、S5→menu）。
- `src/audio/bgm.ts`：`BgmController` 双轨 `Audio` 循环；首次用户手势解锁，`preload=auto` 懒加载；切换 600ms 线性交叉淡化，默认音量 −18dB（≈0.126）；静音 220ms 淡出并暂停，状态写 `localStorage.eos.bgm.muted`；音频元素挂到隐藏 host 便于状态检查。
- `src/audio/BgmContext.tsx` 在 `App` 内包裹 `GameProvider`，随 `screen/run.chapter/currentNodeId` 切轨；标题屏右上 `BgmToggle`，游戏菜单增加「BGM：开/关」。
- 证据物小图（ASSET_LIST §11，P2）本次未产出，线索面板维持文本卡。

**章末小结**（`kind: 'summary'`，C1-010）：
- `ChapterSummary` 读取 `buildChapterSummary(run.flags)` 的纯函数结果，渲染条件摘要行、倒计时锚与固定引导语。
- C1-010 → C2-001；C2-009 → C3-001；C3-008 为结局判定节点（C3-009 无专用数据节点，出口/画廊/回顾由 M2 P2 的界面承担）。
- 第二/三章新增节点类型：`call`（电话字幕）、`composer`（输入框发送/删除，可选 `sceneNote` 在输入框上方渲染场景说明）、`crop`（裁剪交互）、`reasoning`（推理指认）、`checklist`（担责清单，效果由 `fullEffects`/`partialEffects` 数据定义）。`StoryOption.price` 支持价格标签；`RunState.deletedMessages` 为已删除消息存档（旧档缺失按空数组）。

**条件文本变体**（`variants`）：
- `visibleNodeText(run, node)` 返回首个 `requires` 满足的 variant.text，否则 node.text。
- 用于 C1-106 妈妈在 `v_mom_alert=1` 时的联动开场白；选择在进入节点前已写入 flags。

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

- `validateStory`：正式剧本入库前必须通过（error 阻断：goto 断裂/缺 text/messages/speaker/线索不存在/章节起点缺失/screenshot 消息缺截图内容/typing 缺 draft 或 final/floodFrom 越界；warning：节点 id 命名偏离三位约定/autoFlood 用在非 chat 节点）。开发模式在控制台输出。
- 单元测试 **102 项**：条件求值（真值/取反/组合/线索/**v_* 数值比较语法**）、结局判定（E1–E5 各命中分支 + **128 组合表驱动枚举**与 §7.1 独立重述逐一比对）、节点推进（effects/线索去重/选项拦截/聊天过滤/截图内容校验/**条件文本变体**）、**自动上涌状态机**、**截图查看器状态**、**推理指认状态机（错误可重试/正确锁定）**、**担责清单两档（全选 2/部分 1）**、存档（单槽位覆盖/通关失效/损坏 JSON/静默失败/**旧档 deletedMessages 兼容**/**`eos_3min_v1` 与完整版隔离**）、**第一/二/三章 §5 关键原文逐字包含**、**C1/C2 摘要渲染**、**第一、二、三章各四条章级路径终态变量**、**C2-005 四变体 × 留群跨章渲染**、**FR-13 S1–S5 三条路径（默认 E5 / 沉默 E1 / 四选均可进入 S2）**、**FR-13 真人走查回归（S1 四选项独立后果节点、S2 全量错误反馈、S3 场景说明、S4 标题去重）**、**身份提示审计（C1-063/C2-083 打字标签、C2-004 裁剪头注与全量反馈、C3-021 场景说明、C3-007 座位副行）**、**神态差分挂点表（ASSET_LIST §9）**、**BGM 章节映射（标题/结局/三章/3min S1–S5）**、**选项 hint 不含内部变量/文档编号**。
- 浏览器实测（2026-11-16，STORY_SCRIPT V0.1 入库后，应用内浏览器 + 存档注入分段）：
  - 默认线：`v_xm_help=3`、`v_xm_variant=0`、`v_xm_stay=0`、`v_xm_read_zhou=1`、`v_mom_alert=0`、`v_xm_openness=1`、`v_xm_ask_cy=1`；摘要含「妈妈知道了全部」「她敲了办公室的门。李老师收下了全部材料。」
  - 沉默线：`v_xm_help=0`、`v_xm_variant=3`、`v_xm_stay=1`、`v_xm_openness=0`；摘要含「她留在群里，一句话也没有说」「十二天，她把所有东西都收在帆布包里，没有交出去。」
  - 反悔线：12/7 公示后转身交证据，`v_xm_help=2`、`v_did_teacher=1`；摘要含「她敲了办公室的门。」
  - 私信对质线：C1-005-O3 进入 C1-053，`v_xm_variant=2`；摘要含「她私信了予安，问了一句为什么。没有等到回音。」
  - 有存档时点击「开始游戏」弹出覆盖确认（说明结局/证据图鉴保留）；取消返回标题且存档保留；确认后进入内容提示（构成双重确认）。
  - 12/5–12/6 行动窗口可直接「去李老师办公室」，提前达成 `v_xm_help=2`，随后仍能看到 12/7 公示并收 EV-06；公示页撤回选项文案为「先回家，明天再说」。
  - C1-064 改为周日夜选择（内心提示），C1-065/066 的 23:41/23:52 与周一清晨 C1-068 不再矛盾。
  - 生产构建不含 EndingScreen 的判定矩阵输入块（dev-only）；控制台零报错。完整路径同时由 `ch1.paths.test.ts` 的引擎级测试覆盖。
- 前次浏览器实测：2026-11-16 查看器（裁剪图→完整记录 9 条、4 处断口、Esc/遮罩关闭）、自动上涌暂停/恢复/2×/回滚、C1-063 打字删除；2026-11-14 全流程抽查与存档恢复。控制台零报错。
- 收尾验收（2026-11-21）：390×844 / 768×1024 / 1440×900 三档视口逐一实测标题（含 3 分钟入口、画廊/章节选择）、内容提示、完整版章节链路、3 分钟 S1–S5、聊天/裁剪/推理/清单/输入框/结局卡；发现并修复 390px 竖屏舞台被压成 16:9 横带（改为全视口）、聊天窗与选项列表重叠（限高 + 内部滚动）、`--site-space` 被组件 padding 覆盖（改在 game.css 消费变量）。修复后三档无横向滚动、主操作均在视口内。
- 身份提示审计抽查（2026-11-21，构建产物 preview + 存档注入）：C1-063 标签「给妈妈」、C2-083 标签「给小满」、C2-004 头注「11/27 夜 · 予安的手机」且 8 个非目标行逐一有反馈、3min S2-001 同头注、C3-021 场景说明、C3-007 副行「教室 · 你的座位」；控制台零报错。
- 移动端布局抽查（2026-11-22，无头 Chrome 390×844，公网发布后复测）：C1-021 对话/选项重叠 164→0px、C1-005 聊天/选项 197→0px、C1-009 行动窗口 237→0px、C3-006 价格行动窗口 237→0px；长台词 `clientHeight 228 / scrollHeight 1469`（限高内部滚动）；推理 C2-066/C3-054 与清单 C2-086 完整在视口内；无横向滚动。桌面 1440×900 的 C1-005 几何与旧公网快照逐项一致（聊天 x570 y430 300×328、选项 y379–693），无回归。
- 正式视觉素材抽查（2026-11-22，公网 v0.10.0）：390/768/1440 三档加载 6 立绘、5 场景与 2 表情包均 `complete` 且自然尺寸正确；C1-021 立绘 768×1024 显示 90×118（390）/98×128（1440）；C2-006/C3-003 两张表情包与 UI 文案正确、聊天窗自动吸底、390px 无对话/选项重叠；C1-008/C1-003/C2-082/C1-005 的午后/走廊/冷教室/夜房间场景均加载。屏蔽 `assets/characters/*`、`assets/scenes/*` 后立绘回退网格、场景回退 CSS 装饰。控制台零报错。
- 桌面重叠修复与结局插画抽查（2026-11-25，公网 v0.10.1）：1440×900 下 C1-021 对话+3 选项重叠 0（对话 410–578、选项 590–823），C2-006 聊天+2 表情包+3 选项重叠 0（聊天 202–578、选项 590–823），C3-006 价格行动窗口 5 选项全部可见；390×844 与 768×1024 回归仍为 0 重叠、无横向滚动。E5 结局卡插画 800×450 正常加载；e1–e5 公网均 200；控制台零报错。
- 神态差分与 BGM 抽查（2026-11-27，公网 v0.11.0）：C1-006 / C2-007 / C3-006 分别加载 `xiaoman-hurt` / `yuan-crack` / `chenyu-resolve`（768×1024）；390/768/1440 下立绘可见、对话/选项零重叠、无横向滚动。标题 BGM 开关与菜单「BGM：开/关」可用；点击后 `menu.ogg` → `ch1.ogg` 切换，活动音轨 `volume≈0.126`（−18dB）、`loop=true`；静音后 `localStorage.eos.bgm.muted=1`、音轨 paused/volume 0，重载后保持；菜单内切换不关闭菜单。headless 无音频输出，爆音无法听辨；实现为 600ms 从 0 起线性交叉淡化，OGG 循环边界已做 1.5s 交叉淡化。控制台零报错。
- BGM V0.3 直链与哈希（2026-11-28，公网 v0.11.1）：`ch1.mp3`/`ch2.mp3`/`ch3.mp3` 与 `.ogg` 均 200；本地/公网 SHA256 逐一一致（ch1 mp3 `1d925dd2…`、ch2 mp3 `88108a1c…`、ch3 mp3 `d7e55ea6…`、ch1/ch2/ch3 ogg `359f08fc…`/`7210b1e9…`/`322b460d…`）；menu 哈希未变。三首均 40.0s，峰值 0.57–0.70、RMS 0.10–0.15，单段 <1.5MB；代码零改动，测试 102 项不变。
- BGM 音色升级验收（2026-11-28，公网 v0.11.2）：`ch1/ch2/ch3` mp3/ogg 均 200；本地/公网 SHA256 一致（ch1 mp3 `db891ed7…`、ch2 `e3f841bf…`、ch3 `6d3e7189…`；ogg `0660a5f4…`/`5e678681…`/`2f79abb4…`）；menu 哈希仍为 `256a7d92…`（未改）。三首 40.0s；峰值约 0.61–0.69（母带 −3dBFS）；低频 <120Hz 占比 0.2–3.2%、中频 250–2k 75–91%、>4k 约 1.1–1.7%、频谱质心 680–770Hz；逐秒 RMS：ch1 0–0.187、ch2 0.041–0.153、ch3 0.007–0.205（有起伏/留白）；循环边界差 ≤0.0042。代码零改动，测试 102 项不变。已知：仍为合成钢琴而非采样库，高频占比偏低；手机外放需产品侧 A/B 最终确认。
- ch2 刺耳修复验收（2026-11-28，公网 v0.11.3）：`ch2.mp3`/`ch2.ogg` 200；SHA256 `b52a8842…`/`36017c1f…` 与本地一致；ch1/ch3/menu 哈希未变。ch2 40.0s，母带峰值 −3dBFS，RMS 0.153/0.145；低 <120Hz 0.14%/0.05%，200–800Hz 77.8%/78.0%，>4kHz 0.03%/0.28%（≤1%），质心 525/550Hz；循环边界 0.0034；十六分仅 2 小节、最高 D5、hard 仅 1 处。代码零改动，测试 102 项不变。
- M0 审查 3 个 UI 问题修复：530px 顶栏徽章压缩聊天窗（两档 @media 缩小）、聊天窗新消息提示（`● 新消息 ×N · 点击播放`）、结局卡判定输入展示改用引擎 `JUDGEMENT_VARS` 单一来源。另修复：走廊场景装饰「红榜」（v0.1 遗留）改「公告栏」；v0.3 清理 `game.css` 残留 `F-14a` 注释。

## 7. 当前实现范围与边界

- **已实现（M0.5 + M1 + M2 P0/P1）**：引擎全量功能 + 三章正式剧本（`ch1.ts`、`ch2.ts`、`ch3.ts`；C1/C2/C3 全部主节点；C2-005/C3-002 跨章渲染；C2-004 裁剪；C2/C3 推理指认；C2-008 担责清单；C3-002 输入框发送/删除；C3-003 速写本页；C3-005 EV-08；C3-006 价格标签行动窗口；C3-007 班会条件渲染；C3-008 结局卡）。
- **已移除演示网关**：C1-901 与 C2-901 均已移除；C2-009 → C3-001，C3-008 使用正式结局卡。EndingScreen 演示块已移除。
- **M2 P2 已实现**：章节解锁链（完成 ch1 解锁 ch2、ch2 解锁 ch3；标题屏「从章节开始」）、携带重玩（`meta.carriedFlags`，过滤 `v_did_*`）/全新开始、结局画廊（E1–E5 点亮/锁定）、章节回顾（已完成章节 + 证据图鉴 + 结局）；EndingScreen 增加画廊入口，回到标题后可重玩。
- **FR-13 三分钟路径（v0.8 / v0.9.1）**：标题屏入口 B「3 分钟体验」→ S1 群聊（C1-CP1 四选，每项接 1 条独立后果文本节点）→ S2 CropNight（8 个非目标行全量反馈）→ S3 MessageComposer（`sceneNote` 场景说明）→ S4 三线快切（主/副标题去重）→ S5 同一矩阵结算；全部变量 `3min_` 前缀，存档键 `eos_3min_v1`（version 1），不写完整版 `eos.save.v2`/`eos.meta.v2`；S5 固定「这是完整体验的十分之一 / 完整体验里，你还有十二天。」+ 进入完整体验 / 重新选择 3 分钟。
- **收尾交付（v0.9）**：三档视口真机自测完成；生产构建通过并已用 Qoder Sites 公网发布（公开访问、匿名可玩）；`dist/` 可直接静态部署。发布素材存于 `release-assets/`（游戏内 3 张 + 过程记录 3 张）。
- **视觉一档（v0.10.1）**：6 立绘 + 5 场景 + 2 表情包 + 5 结局插画已接入，缺图回退可用；素材合计 2,311,560 bytes（2.20 MiB，≤2.5MB）。有选项时 390/768/1440 统一上下堆叠，桌面正文不再被选项覆盖。分享卡未产出；像素字库仍为占位。
- **P4 第二档（v0.11.0 / v0.11.1 / v0.11.2 / v0.11.3）**：6 神态差分接入主线节点（`portraitMood`）；4 段原创 CC0 BGM（40s、ogg+mp3、交叉淡化、−18dB、静音记忆）接入，8 个音频文件合计 3.71 MiB；ch1–ch3 为增强参数化钢琴原创曲，ch2 于 v0.11.3 定向去刺（八分主干/柔和低通/中频支撑/18% 湿声），menu 保持 ambient 版。证据物小图（P2）延期，线索面板维持文本卡。
- **待实现**：群聊玩家发言深度（PRD-TBD-02）、像素字库、证据物小图（ASSET_LIST §11 P2）、分享卡（OG 图）与 meta、C3-009 的专用尾声数据节点（当前出口由标题/结局屏承担）。
- **引擎设计已预留**：`settlement` 节点类型（章末结算）、`clues` 条件、meta 图鉴、`variants` 条件文本、`price` 价格标签、`deletedMessages` 存档字段。

## 8. 变更记录

- 2026-11-12 v0.1：初稿。M0 竖切片交付：三层架构、节点接口、三轴变量映射、双槽位存档、校验器、33 项测试。
- 2026-11-14 v0.2：P-014 对齐。结局判定改 GAMEPLAY_DESIGN §7.1 五结局矩阵（E5→E4→E3→E1→E2）；状态变量迁移 v_* 数值体系并新增比较条件语法；factRefs 改 EV-xx/§5-X；节点编号统一三位（NODE_ID_RE 收紧，无字母后缀）；存档改单槽位 v2 + 通关失效；占位剧情全量重写为 V0.95 事实基准；测试 41 项（含 128 组合表驱动）。
- 2026-11-16 v0.3：M1-P0 第一章核心交互。新增截图查看器与完整上下文切换（`fullContext`/`cropped`）、群聊自动上涌纯状态机 `flood.ts`（暂停/恢复/2×，无 skip）、`typing` 节点与 `TypingDelete` 组件；C1-005 接通查看器与 autoFlood，C1-051 标记被裁条目，C1-006 后插入打字删除节点；测试 55 项。
- 2026-11-16 v0.4：STORY_SCRIPT V0.1 第一章正式剧本入库。新建 `story/ch1.ts` 替代 placeholder 注册（占位切片删除）；新增 `summary` 节点与 `ChapterSummary`/`ch1Summary.ts`、`variants` 条件文本与 `visibleNodeText`；群像 handle 与 EV-06 入库；四条章级路径测试与 §5 原文包含测试；测试 62 项。
- 2026-11-16 v0.4.1：P1/P2 清理。有存档时「开始游戏」新增覆盖确认（取消保留存档，确认后进入内容提示）；选项 hint 增加防泄露回归测试；更新 beat 字段注释与标题屏状态文案；测试 63 项。
- 2026-11-16 v0.4.2：M1 交付审阅 4 项修复。C1-009 增加 12/5–12/6 办公室路径（C1-117/118，提前达成 help=2、后续仍收 EV-06）；C1-064 改为周日夜选择修复时间线；C1-111-O3 改为「先回家，明天再说」；EndingScreen 判定输入改为 dev-only；测试 66 项。
- 2026-11-17 v0.5：M2 第二章接入。新建 `story/ch2.ts`（C2-001～C2-009）并注册 ch2；C1-010 → C2-001，C2-009 → C2-901 临时网关；新增 call/crop/reasoning/checklist 节点与电话/裁剪/推理/担责清单/时钟组件；C2-005 复用 Ch1 四变体与留群渲染；第三章输入框、速写本、价格标签与 `deletedMessages` 存档字段先行；EndingScreen 改为正式结局卡；测试 78 项。
- 2026-11-18 v0.6：第三章接入。新建 `story/ch3.ts`（C3-001～C3-009）；C2-009 → C3-001，移除 C2-901；新增 composer 节点并接线 MessageComposer；速写本按 visitedNodes 解锁页；C3-006 价格标签；C3-007 班会条件渲染；C3-008 结局卡；测试 84 项。
- 2026-11-18 v0.7：M2 P2。完成章节解锁链、携带重玩/全新开始、结局画廊、章节回顾；`ProgressMeta` 增加 `completedChapters`/`carriedFlags`（旧档兼容）；测试 88 项。
- 2026-11-18 v0.7.1：T-P3-4 首轮 5 项修复。C3-046 拆分 `v_xm_ask_cy` 条件文案；推理支持 `conditionalClues`（EV-08 线索条件渲染）与 `solvedEffects`（指认正确才写 `v_did_ident`，C2-006/C3-054 同步）；C3-007 增加双重追责行与散会行 `v_xm_help` 分叉；测试 91 项。
- 2026-11-18 v0.8：FR-13 三分钟路径。新增 `story/threeMin.ts` S1–S5 与 ch3 后入口；`ChapterId` 增 `3min`，节点编号支持 `S1–S5-xxx`；`evaluateEndingWithPrefix` 读取 `3min_` 变量；`eos_3min_v1` 独立存档与完整版互不影响；S5 固定引导与双跳转；测试 96 项。
- 2026-11-21 v0.9：收尾验收与部署。`isPlaceholder` 移除（正式剧本全量，占位徽章退场）；390/768/1440 三档视口自测并修复竖屏舞台、聊天窗/选项重叠与 `--site-space` 覆盖问题；新增 Nudge 设计变量 `--site-*`；Qoder Sites 公网发布（匿名可玩，完整版 + 3 分钟）；TECHNICAL/README/DEV_LOG 同步部署说明与最终基线（JS gzip 114.20 KB / CSS 6.63 KB）；测试 95 项（移除已无意义的 isPlaceholder 用例）。
- 2026-11-21 v0.9.1：FR-13 真人走查 4 项修复。S1 四选项分别进入 S1-002～S1-005 后果文本节点再进 S2；S2 补齐索引 0/1/7 反馈（8 个非目标行全覆盖）、消息行 `cursor:pointer` 与 hover/focus 高亮、提示统一「点击任意一条消息截图」；`ComposerContent` 新增 `sceneNote` 并在 S3 渲染「群聊之夜 · 陈屿侧」；S4 标题改「S4 · 小满的求助」，S1–S4 主/副标题去重（日期/场景做副标题）。测试 98 项（新增 S1 后果路由、S2 反馈完整性、S3/S4 数据断言）。
- 2026-11-21 v0.9.2：身份提示审计 6 项。`TypingEffect` 新增可选 `label`，`TypingDelete` 按标签渲染（缺省「输入框」）；C1-063 显式「给妈妈」，C2-083 由硬编码「给妈妈」改为「给小满」；C3-021 增加与 3min S3 相同的 `sceneNote`；`CropContent` 新增可选 `headerNote` 并由 `CropNight` 统一渲染，C2-004 与 3min S2-001 均显示「11/27 夜 · 予安的手机」；C2-004 `wrongFeedback` 补齐 0/1/7（8 个非目标行全覆盖）；C3-007 副行改「教室 · 你的座位」。测试 100 项（新增 C2-083 标签、C3-021/C3-007 提示断言；扩展 C1-063、C2-004、S2-001 断言）。
- 2026-11-22 v0.9.3：移动端对话/选项布局 + 重新发布。新增 `.game-bottom` 容器与 `has-choices` 标记：390px 竖屏下对话/聊天与选项上下堆叠，对话区 `max-height` + 文本内部滚动，选项列表按剩余空间收缩/滚动；聊天窗限高 40vh、正文 32vh；场景标题与立绘避让。桌面端 `display: contents` 保持原绝对定位。身份提示 6 项与布局修复一次性重新发布；线上 `index-BZd8IE_9.js` / `index-NciBCxWX.css` 与本地 `dist` SHA256 一致。测试 100 项不变。
- 2026-11-22 v0.10.0：视觉一档 P4。新增 6 立绘（768×1024）、5 场景（1536×1024）、2 表情包（512×512）；`PixelAvatar` 改 `<img>` + 网格回退，`SceneBackground` 按 SceneKey 映射 + CSS 回退，`ChatMessage` 增加 `src` 并由 PhoneChat 渲染图片与 UI 叠字（加载后自动吸底），C2-006/C3-003 改为 chat 演出承载表情包；`EndingScreen` 预留可选插画位（缺图不渲染）。素材经 Pillow 量化压缩至 1,977,842 bytes（1.89 MiB）；可选结局插画预览存 `release-assets/26–30` 但未接入。测试 100 项不变；线上 JS `index-BWpPf4VP.js` / CSS `index-uog8byxe.css` 与本地 SHA256 一致。
- 2026-11-25 v0.10.1：桌面重叠修复 + 结局插画接入。`.game-bottom--choices` 从竖屏媒体查询提升为全视口规则：有选项时 1440 桌面同样底部上下堆叠，对话/聊天正文限高内部滚动，选项在下且按剩余空间滚动；场景标题上移、立绘在有选项时上移避让。5 张结局插画（800×450，`public/assets/endings/e1–e5.png`）接入，EndingScreen 按 endingId 渲染并保留缺图隐藏。素材合计 2,311,560 bytes（2.20 MiB，≤2.5MB）。测试 100 项不变；线上 JS `index-CXAgtL7_.js` / CSS `index-CCoQuU-T.css` 与本地 SHA256 一致。
- 2026-11-27 v0.11.0：P4 第二档。6 张神态差分（`xiaoman-hurt/hope`、`yuan-strained/crack`、`chenyu-tense/resolve`）接入 `portraitMood`，旁白/内心节点可从 mood 推导 POV 立绘；4 段原创 CC0 BGM（menu/ch1/ch2/ch3，40s、ogg+mp3、8 文件 4.22 MiB）与 `BgmController`/`BgmProvider` 接入，600ms 交叉淡化、−18dB、静音记忆、首次用户手势解锁；3min S1→ch1/S2→ch2/S3–S4→ch3/S5→menu。新增神态挂点与 BGM 映射测试（102 项）。证据物小图（P2）延期。线上 JS `index-BKDfnFDj.js` / CSS `index-BbatdVOa.css` 与本地 SHA256 一致。
- 2026-11-28 v0.11.1：BGM V0.3 钢琴主导重制。ch1「空椅子」60 BPM A 小调钢琴独奏（短动机+长留白）、ch2「暗涌」72 BPM D 小调钢琴琶音（八分/十六分 + 低频脉冲/轻心跳）、ch3「余白」54 BPM C 大调钢琴长音 + 轻合成弦垫；均为参数化合成原创（无采样/拼接/外部音源），同名覆盖 `ch1/ch2/ch3.{ogg,mp3}`，menu 不变，代码零改动。8 个音频文件合计 3,800,975 bytes（3.63 MiB）；三首均 40s、单段 <1.5MB；公网直链 200 且 SHA256 与本地一致；测试 102 项不变。
- 2026-11-28 v0.11.2：BGM 音色与演奏升级（§14.2 方案 b）。钢琴合成器增加 3 力度层、击键噪声、踏板/共鸣总线、高频泛音/空气层；演奏加入力度 ±8%、时值 ±10ms、乐句 rubato、踏板延音；和声使用 add9/maj7/sus 色彩；混音 14% 湿声、钢琴偏左/弦垫偏右、100Hz 低切、峰值 −3dBFS。ch1–ch3 主织体上移 C4–C6，低频 <120Hz 降至 0.2–3.2%、中频 75–91%；ch2 密集段进入 hard 力度层，ch1/ch3 保留长留白与起伏。8 个音频文件合计 3,982,975 bytes（3.80 MiB）；公网直链 200 且 SHA256 与本地一致；menu 未变；测试 102 项不变。已知项：仍为合成钢琴而非采样库；手机外放需产品侧 A/B 最终确认；本轮后冻结。
- 2026-11-28 v0.11.3：ch2《暗涌》定向修复（§14.3）。仅重制 ch2：去掉 7.2/9.1/11.3 倍高频泛音、3.8kHz air 与击键噪声；琶音 6.8kHz 低通；十六分仅 2 小节推进、最高 D5；hard 力度仅 1 处转折；attack 约 30ms；200–800Hz 中频支撑、18% 湿声。实测 >4kHz 能量 OGG 0.03% / MP3 0.28%（≤1%），母带峰值 −3dBFS；ch2 新哈希 `b52a8842…`/`36017c1f…`，ch1/ch3/menu 未改。代码零改动，测试 102 项不变。产品手机外放 30 秒「不刺耳」通过后音频冻结。
