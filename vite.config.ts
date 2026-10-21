import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { seoPlugin } from './build/seo.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const path = env.VITE_BASE_PATH || '/';
  if (!path.startsWith('/') || path.startsWith('//') || /[?#\\]/.test(path)) {
    throw new Error('VITE_BASE_PATH must be an absolute pathname, e.g. / or /fake-wechat/.');
  }
  const base = path.endsWith('/') ? path : `${path}/`;
  return {
    base,
    plugins: [react(), tailwindcss(), seoPlugin(env.VITE_SITE_URL, base)],
    build: {
      rolldownOptions: {
        input: {
          index: fileURLToPath(new URL('./index.html', import.meta.url)),
          about: fileURLToPath(new URL('./about.html', import.meta.url)),
        },
      },
    },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  };
});
