import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      'worldrail-sim-26ty.onrender.com',
      '.onrender.com'
    ]
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: [
      'worldrail-sim-26ty.onrender.com',
      '.onrender.com'
    ]
  }
});
