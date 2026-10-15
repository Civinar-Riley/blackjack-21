# 🃏 blackjack-21

单文件 21 点（黑杰克）网页游戏重构版 —— 纯原生 HTML / CSS / JS，无框架，Vite 打包。

## 玩法

- 尽可能接近 21 点但不能超过，打败庄家赢得筹码
- **要牌 / 停牌 / 加倍 / 分牌**，庄家明牌为 A 时可买**保险**
- 黑杰克（A + 10/J/Q/K）赔付 3:2，平局退注
- 筹码、胜负统计、成就系统均存于浏览器 localStorage
- 快捷键：`H` 要牌 / `S` 停牌 / `D` 加倍 / `P` 分牌 / `Space` 发牌 / `R` 重置 / `M` 音效

## 开发

```bash
npm install
npm run dev      # 本地开发服务器
npm run build    # 产物输出到 dist/
npm run preview  # 预览构建产物
```

## 项目结构

```
blackjack-21/
├── index.html              # 页面骨架
├── vite.config.js          # 构建配置（base './'，适配 GitHub Pages）
├── src/
│   ├── main.js             # 入口：挂载样式 + 启动游戏
│   ├── styles/
│   │   └── main.css        # 全部样式
│   └── game/
│       ├── config.js       # 配置（牌副数、下注上下限、赔付等）+ 牌面工具
│       ├── sound.js        # 音效引擎（原生 Web Audio）
│       ├── cards.js        # Deck（多副牌靴）/ Hand（手牌与算分）
│       ├── achievements.js # 成就定义
│       └── game.js         # 游戏主类：状态、下注、判定、DOM 渲染
└── dist/                   # npm run build 产物（已忽略，不入库）
```

## 部署

`npm run build` 后把 `dist/` 传到任意静态托管即可。GitHub Pages 可直接用 Actions 部署 `dist`。
