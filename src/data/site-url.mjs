/**
 * Production origin used for canonical URLs, Open Graph URLs, the sitemap,
 * robots.txt and JSON-LD @ids.
 *
 * The live domain has not been confirmed, so none is hard-coded here.
 * Set it at build time:
 *
 *   SITE_URL=https://your-verified-domain.example npm run build
 *
 * Without SITE_URL the build still works (for local review), but every
 * canonical/OG/sitemap URL points at http://localhost:4321 and the build
 * prints a warning. Do not deploy a build made without SITE_URL.
 */
const raw = (typeof process !== 'undefined' && process.env && process.env.SITE_URL) || '';

export const SITE_URL_CONFIGURED = Boolean(raw);
export const SITE_URL = (raw || 'http://localhost:4321').replace(/\/+$/, '');
