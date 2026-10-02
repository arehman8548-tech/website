# RBE Capital Equip. — website

Backhoe loader rental for construction and infrastructure projects across Kumaon, Uttarakhand. An enterprise of Rotoblast Engineering.

Static site built with **Astro**, with a lazily-loaded **Three.js** scroll story on every major page (see [`docs/MOTION-SYSTEM.md`](docs/MOTION-SYSTEM.md)). See [`docs/STRATEGY.md`](docs/STRATEGY.md) for the original plan and [`docs/SEO-CONVERSION-AUDIT.md`](docs/SEO-CONVERSION-AUDIT.md) for the search research, intent map, schema, conversion, performance measurements and remaining dependencies.

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/, URLs on https://rbecapitalequip.in
npm run preview
```

Production URL: **https://rbecapitalequip.in** (apex is canonical; `www.` 301s to it).

Deploy `dist/` to a static host (build command `npm run build`, publish directory `dist`). `public/_headers` sets long-term caching for hashed assets and fonts, and `public/_redirects` 301s `www.rbecapitalequip.in` to the apex, on Netlify. On any other host, set the www → apex 301 in the host's domain settings.

## Where things live

| Path | What |
|---|---|
| `src/data/site.ts` | **Business facts** — WhatsApp, emails, deployment base (Haldwani), head office (Sector 27C, Faridabad), optional form endpoint |
| `src/data/site-url.mjs` | Production domain `https://rbecapitalequip.in` for canonical URLs, Open Graph, sitemap, robots.txt and schema (overridable with `SITE_URL` at build time) |
| `src/data/geo.ts` | Kumaon locations, districts, terrain belts |
| `src/data/projects.ts` | Project types (Project Solutions page, home cards) |
| `src/data/faq.ts` | Knowledge base Q&A + glossary (also feeds FAQPage schema) |
| `src/data/schema.ts` | JSON-LD builders |
| `src/scripts/backhoe/model.ts` | Procedural backhoe loader, hydraulic rams, steering, bucket loads, arm IK (`hoeIK`) |
| `src/scripts/backhoe/scene.ts` | Home hero: terrain, lighting, scroll timeline, camera |
| `src/scripts/hero.ts` | Home hero bootstrap (lazy load, scroll progress, chapters, HUD) |
| `src/scripts/three/kit.ts` | Shared 3D kit: renderer, sky, lights, terrain material, forest, rocks, dust, excavations, roads, water |
| `src/scripts/three/vehicles.ts` | Tipper, low-bed trailer, service pickup, portal-frame shed, site container |
| `src/scripts/stage/runtime.ts` | Scroll-stage runtime used by every page scene (lazy load, progress, chapters, HUD, fallbacks) |
| `src/scripts/scenes/*.ts` | One scene per page: `machine`, `projects`, `kumaon`, `yard` (Why RBE), `journey` (How it works), `knowledge` |
| `src/components/ScrollStage.astro` | Pinned cinematic section: chapters over a scene, still-sequence fallback |
| `public/geo/` | Baked Kumaon terrain data (DEM, rivers/districts mask, indicative corridors) — `npm run terrain` |
| `public/scenes/` | Stills rendered from the scenes (posters + static fallback) — `npm run stills` |
| `src/styles/global.css` | Design tokens and base styles |

## Regenerating 3D assets

```bash
npm run terrain   # re-bake public/geo/ from SRTM tiles + Census 2011 districts (needs network; see the script header)
npm run build && npm run preview &
CHROMIUM=/path/to/chrome npm run stills   # re-render public/scenes/*.jpg after changing a scene
```

## Enquiry form

With `formEndpoint` empty (current), the form does **not** send anything itself: it validates, then opens WhatsApp (+91 78277 28607) with the enquiry written out, or builds an email to sales@rbecapitalgroup.in. Set `formEndpoint` to a CRM/form webhook to POST submissions instead.

There is no separately verified phone line, so the site has no Call buttons — only WhatsApp and email.

## Debug

- `?instant` — scenes jump straight to the scroll position (no damping or intro).
- `?stagep=0.42` — force a page scene to a given progress (0–1).
- `?capture` — hide page chrome and copy so only the scene renders (used by `npm run stills`).
