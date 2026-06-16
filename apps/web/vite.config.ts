import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  plugins: [react()],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^~/,
        replacement: '',
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src')
      },
      {
        find: '@components',
        replacement: path.resolve(__dirname, './src/components/')
      },
      { find: '@hooks', replacement: path.resolve(__dirname, './src/hooks/') },
      { find: '@constants', replacement: path.resolve(__dirname, './src/constants/') },
      { find: '@assets', replacement: path.resolve(__dirname, './src/assets/') },
      { find: '@pages', replacement: path.resolve(__dirname, './src/pages/') },
      { find: '@PO', replacement: path.resolve(__dirname, './src/PO/') },
      { find: '@utils', replacement: path.resolve(__dirname, './src/utils/') },
      { find: '@interfaces', replacement: path.resolve(__dirname, './src/interfaces/') },
      { find: '@api', replacement: path.resolve(__dirname, './src/api/') },
      { find: '@database', replacement: path.resolve(__dirname, './src/database/') }
    ]
  }
});
