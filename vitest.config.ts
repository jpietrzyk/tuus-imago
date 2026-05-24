import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

function svgReactMock(): Plugin {
  return {
    name: 'svg-react-mock',
    enforce: 'pre',
    resolveId(source) {
      if (source.endsWith('.svg?react')) {
        return source
      }
    },
    load(id) {
      if (typeof id === 'string' && id.endsWith('.svg?react')) {
        const rawName = id.split('/').pop()?.replace('.svg?react', '') ?? 'SvgIcon'
        const name = 'Icon' + rawName.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/-/g, '')
        return `import { createElement, forwardRef } from 'react'; const ${name} = forwardRef((props, ref) => createElement('svg', { ...props, ref, 'data-testid': '${rawName}' })); export default ${name};`
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), svgReactMock()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
