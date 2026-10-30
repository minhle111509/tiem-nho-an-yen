import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon-64.png', 'apple-touch-icon.png', 'logo-192.png', 'momo-qr.jpg'],
        manifest: {
          id: '/',
          name: 'Tiệm Nhỏ An Yên',
          short_name: 'Tiệm An Yên',
          description: 'Cửa hàng vật phẩm phong thủy, mặt dây chuyền và nụ trầm hương phong cách Zen',
          theme_color: '#F5F0E6',
          background_color: '#F5F0E6',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
    },
  };
});
