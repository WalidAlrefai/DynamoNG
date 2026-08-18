import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/tools/workspace-plugin',
  plugins: [nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  test: {
    name: 'workspace-plugin',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    // Each test invokes the real `@nx/angular:library` generator (not mocked),
    // which is slow enough under CI/parallel-run contention to exceed
    // Vitest's 5000ms default.
    testTimeout: 20000,
    coverage: {
      reportsDirectory: '../../coverage/tools/workspace-plugin',
      provider: 'v8' as const,
    },
  },
}));
