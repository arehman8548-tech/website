import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, PRODUCTION_URL } from './src/data/site-url.mjs';

if (SITE_URL !== PRODUCTION_URL) {
  console.warn(`\n[rbe] SITE_URL override in use — canonical, Open Graph, sitemap and schema URLs will use ${SITE_URL}, not ${PRODUCTION_URL}.\n`);
}

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { inlineStylesheets: 'always', format: 'directory' },
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'monthly',
    }),
  ],
  vite: {
    build: { assetsInlineLimit: 2048, chunkSizeWarningLimit: 700 },
  },
});
