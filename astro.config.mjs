import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://book.sdgaz.com',
  build: {
    // Generates licensed-electrician-columbus.html (not a directory)
    // Vercel serves it at /licensed-electrician-columbus with no trailing slash
    format: 'file',
    // 'auto' lets Astro decide: small CSS stays inline, large CSS becomes a cached hashed file
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
