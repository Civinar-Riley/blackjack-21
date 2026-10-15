import { defineConfig } from 'vite';

// base 用相对路径，dist 产物可直接部署到 GitHub Pages / 任意静态托管
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
