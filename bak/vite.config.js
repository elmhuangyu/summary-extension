import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: 'js/background.js',
        content: 'js/content.js',
        sidepanel: 'js/sidepanel.js',
        settings: 'js/settings.js',
        ai_service: 'js/ai_service.js',
        sidepanel_html: 'html/sidepanel.html',
        settings_html: 'html/settings.html',
        style_css: 'css/style.css',
      },
      output: {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  publicDir: 'public',
});
