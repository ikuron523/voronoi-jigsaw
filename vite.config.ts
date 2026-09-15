import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 公開ウエブサイトで公開する場合、以下に配置したいサブディレクトリ名を記述します。
  // サブディレクトリ名が未定の場合など、どこに置いても動くようにしたい場合は、base: './', とします。
  base: './',
})
