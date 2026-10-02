/**
 * Renders the realistic stills used as scene posters and as the static
 * (reduced-motion / no-WebGL) visuals, straight from the live scenes.
 *
 *   npm run build && npm run preview &        # site on http://localhost:4321
 *   CHROMIUM=/path/to/chrome node scripts/capture-stills.mjs [scene…]
 *
 * Needs a WebGL-capable Chromium (headless uses SwiftShader). Output: public/scenes/*.jpg
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4321';
const W = 1600, H = 1000;
const shots = {
  machine: { path: '/backhoe-loader-rental/', ps: [0.06, 0.29, 0.43, 0.6, 0.78, 0.97] },
  kumaon: { path: '/kumaon-service-area/', ps: [0.06, 0.3, 0.46, 0.63, 0.82, 0.97], extra: { 'kumaon-home': 0.97 } },
  projects: { path: '/project-solutions/', ps: [0.6, 0.62, 0.55, 0.55, 0.62, 0.62].map((t, i) => (i + t) / 6) },
  yard: { path: '/why-rbe/', ps: [0.08, 0.3, 0.53, 0.76, 0.97], extra: { contact: 0.3 } },
  journey: { path: '/how-rental-works/', ps: [0.07, 0.24, 0.38, 0.55, 0.71, 0.84, 0.98] },
};
const only = process.argv.slice(2);
fs.mkdirSync('public/scenes', { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (const [name, s] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue;
  const jobs = s.ps.map((p, i) => [`${name}-${i}`, p]).concat(Object.entries(s.extra ?? {}));
  for (const [file, p] of jobs) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}${s.path}?capture&stagep=${p}`, { waitUntil: 'load' });
    // scroll so the stage's top meets the viewport top (scrollIntoView would honour scroll-padding)
    await page.evaluate(() => { const el = document.querySelector('[data-stage]'); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY); });
    await page.waitForFunction(() => document.querySelector('[data-stage]')?.classList.contains('is-live'), null, { timeout: 120000 });
    await page.waitForTimeout(2500);
    // ?capture hides all page chrome, so the stage fills the viewport
    await page.screenshot({ path: `public/scenes/${file}.jpg`, type: 'jpeg', quality: 80 });
    console.log('✓', file, p.toFixed(3));
    await page.close();
  }
}
await browser.close();
