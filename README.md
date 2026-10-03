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
| `src/data/site.ts` | **Business facts** — phone numbers and their labels (Sales / Site Coordination), WhatsApp, email, hours, address, form endpoint. Confirmed business facts; see STRATEGY.md for what is still missing |
| `src/data/site-url.mjs` | Production domain (canonical URLs, sitemap, schema) |
| `src/data/geo.ts` | Kumaon locations, districts, terrain belts |
| `src/data/projects.ts` | Project types (Project Solutions page, home cards) |
| `src/data/faq.ts` | Knowledge base Q&A + glossary (also feeds FAQPage schema) |
| `src/data/schema.ts` | JSON-LD builders |
| `src/scripts/backhoe/model.ts` | Procedural backhoe loader + hydraulic rams |
| `src/scripts/backhoe/scene.ts` | Terrain, lighting, scroll timeline, camera |
| `src/scripts/hero.ts` | Hero bootstrap (lazy load, scroll progress, chapters, HUD) |
| `src/styles/global.css` | Design tokens and base styles |
| `src/styles/content.css` | Shared layout for the buyer, location, pricing and emergency pages |
| `worker/index.js` | Cloudflare Worker: `/api/enquiry` (Resend) and `/api/event` (analytics) |
| `src/scripts/track.ts` | First-party event tracking and lead attribution |

## Enquiry form and Worker

The contact form POSTs to `/api/enquiry`, handled by `worker/index.js` on the same Cloudflare Worker that serves the site (`wrangler.jsonc`: `main` + `run_worker_first: ["/api/*"]` — every other path is still served straight from `dist/`). The Worker validates the enquiry, gives it a reference (`RBE-YYMMDD-XXXXX`) and sends it through **Resend** to `sales@rbecapitalgroup.in` (Cloudflare Email Routing then forwards that address as configured). No database, no third-party form service.

- **Secret:** `RESEND_API_KEY` must be set as a Worker secret (`npx wrangler secret put RESEND_API_KEY`, or Workers → Settings → Variables and Secrets). It is never in the repo, the HTML or the logs. Without it the Worker returns 503 and the form shows the failure state with call/WhatsApp options and the enquiry pre-filled for WhatsApp.
- **Sender:** `ENQUIRY_FROM` in `wrangler.jsonc` must use a domain verified in Resend.
- **Failure UX:** the visitor keeps their details and can retry, call Sales or Site Coordination, or send the same enquiry on WhatsApp.

## Measurement

`src/scripts/track.ts` (≈2 KB, first-party) records `phone_click_sales`, `phone_click_site_coordination`, `whatsapp_click`, `email_click`, `cta_click` and the form events (`form_start`, `form_submit`, `form_success`, `form_error`, `form_validation_error`, `form_whatsapp_followup`, `form_whatsapp_fallback`, `form_email_fallback`). Each event carries page path, placement, page intent/location, landing page, referrer host and UTM source/medium/campaign — never name, phone, email or message. Events go to `window.dataLayer` (ready for GTM/GA4; the CSP in `public/_headers` would need their domains) and to `/api/event`, which writes them to **Workers Logs** (`observability` in `wrangler.jsonc`). The same attribution travels with each enquiry email.

## Phone numbers

`site.phoneDisplay` (number 1) is **Sales** — quotes, availability, terms, and the WhatsApp number. `site.phone2Display` (number 2) is **Site Coordination** — machines on site, mobilisation and emergency clearance. Emergency pages lead with Site Coordination.

## Debug

Append `?instant` to the home URL to make the 3D scene jump straight to the scroll position (no damping or intro) — useful for screenshots.
