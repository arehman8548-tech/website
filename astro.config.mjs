import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL, SITE_URL_CONFIGURED } from './src/data/site-url.mjs';

if (!SITE_URL_CONFIGURED) {
  console.warn(`\n[rbe] SITE_URL is not set — canonical, Open Graph, sitemap and schema URLs will use ${SITE_URL}.\n[rbe] Build with SITE_URL=https://<verified-domain> before deploying.\n`);
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
