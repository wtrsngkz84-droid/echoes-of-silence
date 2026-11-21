# echoes-of-silence

《沉默的回声》——以受害者、施暴者与旁观者三种视角，讲述校园霸凌、谣言与网络暴力的 2D 像素风互动叙事游戏。

## 运行方式

```bash
npm install     # 安装依赖
npm run dev     # 本地开发（http://localhost:5173）
npm test        # 运行单元测试（100 项）
npm run build   # 类型检查 + 生产构建（输出 dist/）
npm run preview # 本地预览构建产物
```

## 在线游玩与部署

- 公网地址：<https://echoes-of-silence-rwx94cwcoxm.qoder.zone>（Qoder Sites，公开访问、无需登录；含完整版与「3 分钟体验」双入口）。
- 静态部署：`npm run build` 后将 `dist/` 交给任意静态托管即可；`base: './'` 使用相对资源，可部署在任意子路径，无路由依赖。

## 当前状态

三章正式剧本已接入：C1-001～C1-010、C2-001～C2-009、C3-001～C3-009；含截图查看器、裁剪之夜、推理指认、担责清单、输入框发送/删除、速写本、价格标签、班会条件渲染与正式结局卡；章节解锁链、携带重玩、结局画廊与章节回顾已完成。另提供 FR-13「3 分钟体验」入口（S1–S5，独立存档）。已完成 390/768/1440 三档视口自测并发布上线。详见 [docs/TECHNICAL.md](docs/TECHNICAL.md)。

## 项目文档

- 产品：[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) · [TEAM_ROLES.md](TEAM_ROLES.md) · [PROJECT_DECISIONS.md](PROJECT_DECISIONS.md) · [docs/](docs/)
- 技术：[docs/TECHNICAL.md](docs/TECHNICAL.md) · [docs/QODER_DEV_LOG.md](docs/QODER_DEV_LOG.md)
