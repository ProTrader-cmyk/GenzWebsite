import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // '/GenzWebsite/' was needed to serve from
  // https://<user>.github.io/GenzWebsite/ — a custom domain serves from the
  // root instead, so every asset URL needs to resolve from '/'.
  base: '/',
});
