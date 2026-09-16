import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = import.meta.env.PUBLIC_SITE_URL || undefined;
export default defineConfig({
  site,
  output: 'static',
  integrations: site ? [sitemap()] : [],
  vite: { plugins: [tailwindcss()] }
});
