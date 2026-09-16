import { defineConfig } from 'vite';

export default defineConfig({
  preview: {
    host: '0.0.0.0',
    allowedHosts: [
      'worldrail-sim-26ty.onrender.com',
      '.onrender.com'
    ]
  }
});
