/**
 * Production origin used for canonical URLs, Open Graph URLs, the sitemap,
 * robots.txt and JSON-LD @ids.
 *
 * The canonical host is the apex domain https://rbecapitalequip.in.
 * https://www.rbecapitalequip.in must 301 to it (see public/_redirects).
 *
 * SITE_URL can still be overridden at build time (e.g. for a staging host):
 *
 *   SITE_URL=https://staging.example npm run build
 */
export const PRODUCTION_URL = 'https://rbecapitalequip.in';

const raw = (typeof process !== 'undefined' && process.env && process.env.SITE_URL) || '';

export const SITE_URL = (raw || PRODUCTION_URL).replace(/\/+$/, '');
