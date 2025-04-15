import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

const packageName = 'wx-echo';

export default defineConfig({
  build: {
    lib: {
      // 使用多入口配置
      entry: {
        [packageName]: resolve(__dirname, 'src/index.ts'),
        types: resolve(__dirname, 'src/types-export.ts')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === packageName) {
          return format === 'es' ? `${packageName}.js` : `${packageName}.cjs`;
        }
        return format === 'es' ? `${entryName}.js` : `${entryName}.cjs`;
      }
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        preserveModules: false
      }
    }
  },
  test: {
    globals: true,
    environment: 'node'
  },
  plugins: [dts()]
});
