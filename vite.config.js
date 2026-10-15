import { defineConfig } from 'vite';

// base 用相对路径，dist 产物可直接部署到 GitHub Pages / 任意静态托管
export default defineConfig({
  base: './',
  // 构建时间戳：大厅 fetch 游戏单文件时拼 ?b= 时间戳破缓存（games/*.html 文件名无哈希）
  define: {
    __HALL_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')),
  },
  build: {
    outDir: 'dist',
  },
});
