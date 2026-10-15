<div align="center">

# 🎮 游戏厅

[![Deploy to GitHub Pages](https://github.com/Civinar-Riley/blackjack-21/actions/workflows/deploy.yml/badge.svg)](https://github.com/Civinar-Riley/blackjack-21/actions/workflows/deploy.yml)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vite.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black&style=flat-square)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](package.json)

**多游戏合集 —— 一个大厅，4 款游戏随便选**

### [▶️ 进入游戏厅](https://civinar-riley.github.io/blackjack-21/)

</div>

> 📌 21 点单游戏旧版（Vite 多文件）在 [`main-backup-21point` 分支](https://github.com/Civinar-Riley/blackjack-21/tree/main-backup-21point)，游戏厅里的 21 点是单文件版。

## 🕹️ 收录游戏

| 游戏 | 玩法 |
|------|------|
| 🃏 21 点 - 黑杰克 | 下注、要牌、加倍、分牌，40 个成就 |
| 💣 扫雷 | 经典扫雷，扫开所有安全格 |
| 🏇 赛马场 | 赛马竞速，看准马儿下注 |
| 🀄 连连看 | 把相同的牌全部配对消除 |

## ✨ 特性

- 🖥️ **卡片墙首页**：深色赌场风，选游戏一键进
- 🔒 **沙箱隔离**：每个游戏跑在独立沙箱 iframe 里，读不到页面其他数据
- 💾 **自动存档**：localStorage 垫片 + 消息快照桥，刷新不丢，工具栏可清空
- ⛶ **全屏**：一键全屏沉浸玩，Esc 退出

## ➕ 自己加游戏

1. 把**单文件 HTML**（样式/脚本全内联）丢进 `public/games/`
2. 在 `src/hall/hall.js` 的 `GAMES` 数组加一行：文件名、图标、名字、一句话介绍
3. 推送到 `main` 分支，自动部署上线

## 🛠️ 技术

- Vite 6 + 原生 HTML/CSS/JS，零运行时依赖
- 存档桥 `src/hall/gamesave.js`：localStorage 垫片 + postMessage 快照（从 game-hall 项目移植，久经考验）
- 沙箱：`sandbox="allow-scripts allow-pointer-lock allow-modals"`（无 `allow-same-origin`）
- 部署：GitHub Actions，推送 `main` 自动构建部署到 GitHub Pages 根目录

## 💻 本地运行

```bash
npm install
npm run dev      # 开发预览
npm run build    # 构建，产物在 dist/
```

> ⚠️ 直接双击 `dist/index.html` 打不开（游戏靠 `fetch` 动态加载，浏览器安全限制要求走 http 协议）。本地测试用 `npx -y serve dist` 起个静态服务再访问。
