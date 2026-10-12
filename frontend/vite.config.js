import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { dirname, resolve } from 'node:path';

// Frontend plugins (docs/plugins.md, "Frontend"): comma-separated paths to plugin entry files, bundled
// into this build. Empty for the core build.
const pluginEntries = (process.env.IVMS_FRONTEND_PLUGINS || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)
  .map((p) => resolve(p));

/** `import plugins from 'virtual:ivms-plugins'`: the default exports of the plugin entries, in order. */
function ivmsPlugins() {
  const id = 'virtual:ivms-plugins';
  return {
    name: 'ivms-plugins',
    resolveId: (source) => (source === id ? '\0' + id : null),
    load(resolved) {
      if (resolved !== '\0' + id) return null;
      const imports = pluginEntries.map((p, i) => `import p${i} from ${JSON.stringify(p)};`);
      return `${imports.join('\n')}\nexport default [${pluginEntries.map((_, i) => `p${i}`).join(', ')}];`;
    },
  };
}

export default defineConfig({
  plugins: [react(), ivmsPlugins()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Plugins live outside this folder: make them use this app's React, not a second copy
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3000,
    host: true,
    fs: { allow: ['.', ...pluginEntries.map((p) => dirname(p))] },
    // Backend API (python -m ivms); keeps the browser on one origin in development
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
