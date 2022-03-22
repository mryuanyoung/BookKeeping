import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components/'),
      '@hooks': path.resolve(__dirname, './src/hooks/'),
      '@constants': path.resolve(__dirname, './src/constants/'),
      '@assets': path.resolve(__dirname, './src/assets/'),
      '@pages': path.resolve(__dirname, './src/pages/'),
      '@PO': path.resolve(__dirname, './src/PO/'),
      '@utils': path.resolve(__dirname, './src/utils/'),
      '@interfaces': path.resolve(__dirname, './src/interfaces/'),
      '@api': path.resolve(__dirname, './src/api/'),
      '@database': path.resolve(__dirname, './src/database/')
    }
  }
});
