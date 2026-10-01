# RBE Capital Equip. — website

Backhoe loader rental for construction and infrastructure projects across Kumaon, Uttarakhand. An enterprise of Rotoblast Engineering.

Static site built with **Astro** and a lazily-loaded **Three.js** hero. See [`docs/STRATEGY.md`](docs/STRATEGY.md) for the original plan and [`docs/SEO-CONVERSION-AUDIT.md`](docs/SEO-CONVERSION-AUDIT.md) for the search research, intent map, schema, conversion, performance measurements and remaining dependencies.

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
SITE_URL=https://<verified-domain> npm run build   # static output in dist/
npm run preview
```

Deploy `dist/` to any static host (Netlify, Cloudflare Pages, Vercel, S3). `public/_headers` sets long-term caching for hashed assets and fonts on hosts that support it.

## Where things live

| Path | What |
|---|---|
| `src/data/site.ts` | **Business facts** — WhatsApp, emails, deployment base (Haldwani), head office (Sector 27C, Faridabad), optional form endpoint |
| `src/data/site-url.mjs` | Reads `SITE_URL` at build time for canonical URLs, sitemap, robots.txt and schema. No domain is hard-coded |
| `src/data/geo.ts` | Kumaon locations, districts, terrain belts |
| `src/data/projects.ts` | Project types (Project Solutions page, home cards) |
| `src/data/faq.ts` | Knowledge base Q&A + glossary (also feeds FAQPage schema) |
| `src/data/schema.ts` | JSON-LD builders |
| `src/scripts/backhoe/model.ts` | Procedural backhoe loader + hydraulic rams |
| `src/scripts/backhoe/scene.ts` | Terrain, lighting, scroll timeline, camera |
| `src/scripts/hero.ts` | Hero bootstrap (lazy load, scroll progress, chapters, HUD) |
| `src/styles/global.css` | Design tokens and base styles |

## Enquiry form

With `formEndpoint` empty (current), the form does **not** send anything itself: it validates, then opens WhatsApp (+91 78277 28607) with the enquiry written out, or builds an email to sales@rotoblasteng.com. Set `formEndpoint` to a CRM/form webhook to POST submissions instead.

There is no separately verified phone line, so the site has no Call buttons — only WhatsApp and email.

## Debug

Append `?instant` to the home URL to make the 3D scene jump straight to the scroll position (no damping or intro) — useful for screenshots.
