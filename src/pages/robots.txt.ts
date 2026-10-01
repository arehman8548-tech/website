import type { APIRoute } from 'astro';
import { SITE_URL } from '../data/site-url.mjs';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`, { headers: { 'Content-Type': 'text/plain' } });
