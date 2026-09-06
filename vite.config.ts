import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages 项目页部署在子路径（username.github.io/仓库名），必须用相对资源路径
  base: './',
  plugins: [react()],
})
