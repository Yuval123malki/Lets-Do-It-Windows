import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
         // For Offline Use:
        'process.env.AI_BASE_URL': JSON.stringify(env.AI_BASE_URL),
        'process.env.AI_API_KEY': JSON.stringify(env.AI_API_KEY),
        'process.env.AI_MODEL_NAME': JSON.stringify(env.AI_MODEL_NAME)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
