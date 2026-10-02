# RBE Capital Equip. — website

Backhoe loader rental for construction and infrastructure projects across Kumaon, Uttarakhand. An enterprise of Rotoblast Engineering.

Static site built with **Astro** and a lazily-loaded **Three.js** hero. See [`docs/STRATEGY.md`](docs/STRATEGY.md) for research, information architecture, search-intent map and the pre-launch checklist.

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview
```

Deployed as a static-assets-only Cloudflare Worker (`wrangler.jsonc`: serves `dist/`, custom 404, automatic trailing slashes) via Workers Builds — build command `npm run build`, deploy command `npx wrangler deploy`. `public/_headers` sets long-term caching for hashed assets and fonts. The www → apex 301 is a Cloudflare Redirect Rule, not a repo file (`_redirects` cannot redirect by hostname).

## Where things live

| Path | What |
|---|---|
| `src/data/site.ts` | **Business facts** — phone, WhatsApp, email, hours, address, form endpoint. Confirmed business facts; see STRATEGY.md for what is still missing |
| `src/data/site-url.mjs` | Production domain (canonical URLs, sitemap, schema) |
| `src/data/geo.ts` | Kumaon locations, districts, terrain belts |
| `src/data/projects.ts` | Project types (Project Solutions page, home cards) |
| `src/data/faq.ts` | Knowledge base Q&A + glossary (also feeds FAQPage schema) |
| `src/data/schema.ts` | JSON-LD builders |
| `src/scripts/backhoe/model.ts` | Procedural backhoe loader + hydraulic rams |
| `src/scripts/backhoe/scene.ts` | Terrain, lighting, scroll timeline, camera |
| `src/scripts/hero.ts` | Hero bootstrap (lazy load, scroll progress, chapters, HUD) |
| `src/styles/global.css` | Design tokens and base styles |

## Enquiry form

With `formEndpoint` empty, the contact form validates and opens WhatsApp with the enquiry pre-filled (email fallback). Set `formEndpoint` to a Formspree or CRM webhook URL to POST submissions instead.

## Debug

Append `?instant` to the home URL to make the 3D scene jump straight to the scroll position (no damping or intro) — useful for screenshots.
