# RBE Capital Equip. — site strategy

How the site was planned: the business, the research, the structure, and what still needs confirming before launch.

## 1. Business proposition

**RBE Capital Equip.** (an enterprise of **Rotoblast Engineering**) rents **backhoe loaders** to contractors, developers and infrastructure companies running construction projects in **Kumaon, Uttarakhand**.

The site has to answer one buyer question: *"Can these people actually support my project in difficult terrain?"* It does that by covering, in order: **recognition → problem → capability → suitability → trust → availability → contact**.

### Confirmed business facts (round 2 — supplied by the owner)

| Fact | Value | Where it appears |
|---|---|---|
| Calls | +91 98110 30794 | Header, hero, footer, contact, schema |
| WhatsApp | +91 78277 28607 | All WhatsApp links, footer, contact, schema |
| Sales email | sales@rbecapitalgroup.in | Form fallback, footer, contact, schema |
| General email | rehman@rbecapitalgroup.in | Footer, contact, Why RBE, schema |
| Head office | Sector 27C, Faridabad, Haryana, India | Footer, contact, Why RBE, home facts, schema `address` |
| Deployment bases | Haldwani; Majkhali (near Ranikhet, Almora district) | Hero, map, service area, FAQ, schema `location` |
| Domain | https://rbecapitalgroup.in | `src/data/site-url.mjs` |
| Operator | Always included | Everywhere terms are stated |
| Minimum rental | 15 days (no hourly / daily hire) | Hero, terms, FAQ, form |
| GST invoice | On request | Terms, FAQ, form field |
| Rock breaker | Available (hydraulic) | Machine page, projects, FAQ, form |
| Commitments | Machine checked before dispatch · terms in writing · breakdown process agreed up front · one point of contact | Why RBE, process, home |

Majkhali location (public sources): Ranikhet tehsil, Almora district, PIN 263652, on the Ranikhet–Almora road ~10 km from Ranikhet, ≈29.68° N 79.51° E, ≈1,720–1,800 m (site uses 1,800 m, rounded).

### Still NOT on the site (not supplied — do not add without real evidence)

Fleet size · a fixed machine model or spec (JCB, range of models) · 4WD or 2WD · years in operation · Rotoblast Engineering history/website (placeholder kept) · client names, dates, durations, quantities or results for the two projects · testimonials · certifications · response time · pricing · GSTIN · machine documents · operator photos · Haldwani/Majkhali base photos · real video.

## 1b. Round-2 re-audit — what the first build got wrong

- **Unusable contact data.** Every call/WhatsApp/email link was a placeholder; the site could not generate a single enquiry. Fixed.
- **Wrong domain** in canonical/sitemap/schema (`rbecapitalequip.com`, then `rbecapitalequip.in`). Fixed to `rbecapitalgroup.in`, the domain actually owned.
- **No home base.** The site said "across Kumaon" but never where the machine actually comes from — the single most useful fact for "JCB rental Haldwani" searches and for any buyer asking "will it reach my site?". Now Haldwani + Majkhali are stated everywhere it matters.
- **Unconfirmed practices written as promises** (servicing "timed around your hours", machine "maintenance discipline", "heritage"). Removed or replaced with the four owner-confirmed commitments.
- **Implied fleet.** Copy said "backhoe loaders" as if a fleet existed. Reworded so no fleet size is implied.
- **No filter against low-value work.** "Short assignment" and "A few days" invited daily jobs. Replaced by the confirmed 15-day minimum and an explicit line pointing hourly needs elsewhere.
- **Procurement blind spots.** No GST, no head office, no company facts in one place. Added a facts list (home, Why RBE, contact) and GST/role fields on the form.
- **Disparaging comparison** ("You chase the owner") framed as competitor fact. Reframed as risks of informal hire vs RBE commitments.
- **Schema issues.** `sameAs` pointed at a wa.me link; Organization lacked an address. Fixed; bases modelled as `location` Places.
- **Mobile header bug.** Menu button overflowed the viewport at 360–390 px. Fixed.
- **Research was from memory.** Replaced by live search below.

## 1c. Real media (round 3)

Six genuine phone photographs (Redmi cameras / WhatsApp copies, 2019–2022) of RBE's JCB backhoe loader, attributed by the owner to two real projects:
**Ranikhet–Majkhali resort development** (Almora district — site cutting and levelling) and **Padampuri road widening** (Nainital district). RBE supplied a JCB backhoe loader with operator on both.

| Placement | Photo(s) | Purpose |
|---|---|---|
| Home → "Real sites" (straight after the 3D hero) | Resort at dusk + snow; Padampuri working + stabilisers | 3D model → real-world proof |
| Project Solutions → site development / road construction | Resort wide + snow; Padampuri working + retaining wall | Case evidence inside the matching project type |
| Backhoe Loader → typical specification | Padampuri front three-quarter (UK02 plate) | The real machine beside generic figures; model varies by job |
| Backhoe Loader → working in the hills | Padampuri, stabilisers below retaining wall | Supports the "Ground" point |
| Kumaon Service Area → inner hills belt; deployment planning | Resort wide; resort snow | Worked in this belt; season planning |

Not used: `1b77f74d-….jpg` and `JCB_operating_at_construction_site_….mp4` show signs of AI generation (Google encoder tag, garbled "JOX/JDX" lettering, no camera EXIF). They stay in `media/originals/` unpublished until their origin is confirmed. No real video was supplied.

Pipeline: `node scripts/prep-media.mjs` crops originals (framing only, metadata stripped) into `src/assets/media/`; Astro `<Picture>` serves AVIF/WebP at 480–1600 px, lazy-loaded with fixed aspect ratios (CLS ≈ 0). No media loads before the visitor scrolls past the hero.

## 2. Research summary

**Geography (verified):** Kumaon division = 6 districts: Nainital, Udham Singh Nagar, Almora, Bageshwar, Pithoragarh, Champawat. "Berinath" in the brief = **Berinag** (Pithoragarh district, ~1,860 m). Altitudes run from ~210 m (Rudrapur) to ~2,280 m (Mukteshwar), so the site organises locations into three **terrain belts** instead of a city list:

- **Terai & plains gateway** — Rudrapur, Pantnagar, Kashipur, Haldwani, Kathgodam
- **Lake district & mid-hills** — Bhimtal, Bhowali, Nainital, Ramgarh, Mukteshwar
- **Inner hills** — Ranikhet, Almora, Bageshwar, Berinag

**Market context:** active state road programmes (PWD network expansion, rural road upgrades, Rudrapur/Kashipur bypasses, temple-circuit road widening in Kumaon), industrial estates in Udham Singh Nagar, hill real estate around Bhimtal–Ramgarh–Mukteshwar.

**Live search check (Oct 2026).** Google/Bing/Playwright were blocked by this environment's egress policy, so research used the built-in web search tool; competitor pages themselves could not be opened.

- *JCB rental Haldwani* → Justdial (≈31 listings), Sulekha, an aggregator advertising "JCB backhoe loaders from ₹2,999/day with operator", local firms offering **hourly** hire. Price-led, small-job audience.
- *Backhoe loader on rent Nainital* → aggregator page (JCB 3DX Plus "from ₹5,000"), national marketplaces. No local specialist.
- *JCB on rent Rudrapur* → IndiaMART supplier listing ₹75,000/month.
- *JCB on rent Almora / Ranikhet* → **no dedicated supplier result at all** — only cab and property listings. RBE's Majkhali base is a genuine, unclaimed position.
- *Hill road backhoe Uttarakhand* → aggregator copy recommending 4WD (JCB 4DX) for hill stretches/NHAI work; hourly ₹1,100–1,200.
- Rate-card articles: dry hire ₹550–900/hr, ₹90k–1.4L/month; "most require a minimum of 1 month". Buyer questions cluster on per-hour/per-day price, diesel, operator, minimum period.
- Market activity (public tenders): PWD Almora road reconstruction tenders, an EPC package on SH-62 (Garjiya–Betalghat–Khairna–Mukteshwar), NHIDCL DPR for Bhimtal–Almora, PWD Nainital road widening.

Conclusion: the SERP is directories and day-rate aggregators. RBE should not compete on hourly price; it should be the clear answer for **project-length, operator-included hire with a local base — especially in the hills**.

## 3. Search-intent map

| Intent cluster | Example queries | Answered on |
|---|---|---|
| Commercial | backhoe loader rental Kumaon · JCB on rent Uttarakhand · construction equipment rental Kumaon | `/`, `/backhoe-loader-rental/` |
| Local | JCB rental Haldwani · backhoe loader Nainital · JCB on hire Rudrapur / Almora | `/kumaon-service-area/` (one card per location, with an anchor) |
| Project-specific | backhoe loader for hill road construction · road widening · side drain · site development · culvert excavation | `/project-solutions/#…` |
| Problem-based | how to arrange machine for remote site · machine reach hill site | `/kumaon-service-area/#deployment`, `/knowledge/#remote` |
| Decision-stage | backhoe loader rental long term · monthly JCB rent · backhoe vs excavator | `/backhoe-loader-rental/#rental-terms`, `#when-not` |
| Informational | how deep can a JCB dig · what can a backhoe loader do · is JCB a backhoe loader | `/backhoe-loader-rental/#what-it-does`, `/knowledge/` |
| Conversational / AEO | "Can I get a backhoe loader deployed to a remote Kumaon site?" · "What if it breaks down mid-project?" | `/knowledge/` answer blocks (direct answer first) |
| Price | JCB rent per hour Haldwani · monthly JCB rent | `/knowledge/#cost`, `#minimum` explain RBE's period-based basis honestly (no invented rates) |
| Local base | JCB on rent Haldwani · backhoe near Ranikhet / Almora | `/knowledge/#haldwani`, `#ranikhet`, `/kumaon-service-area/#haldwani`, `#majkhali` |
| Procurement | GST invoice · operator included · rock breaker | `/knowledge/#gst`, `#operator`, `#breaker`, home facts list |

Deliberately **not** targeted: home/garden digging, agricultural, one-off residential jobs.

## 4. Information architecture (8 pages)

1. **Home** `/` — conversion + brand; 3D scroll story; buyer concerns; audiences; project types; Kumaon; process; Rotoblast; direct answers.
2. **Backhoe Loader** `/backhoe-loader-rental/` — machine anatomy, tasks, typical spec, honest limits, hill suitability, rental terms. `Service` schema.
3. **Project Solutions** `/project-solutions/` — 6 project types, each: tasks, Kumaon realities, where it stops, nearby locations, related questions.
4. **Kumaon Service Area** `/kumaon-service-area/` — map, altitude profile, 3 belts, 14 location cards, deployment factors, guidance for outside contractors.
5. **Why RBE** `/why-rbe/` — partner vs machine-on-hire, support plan, Rotoblast relationship, what we won't do.
6. **How Rental Works** `/how-rental-works/` — 6 steps with outcomes; 5 things needed for a fast quote.
7. **Knowledge** `/knowledge/` — 23 buyer questions in 5 groups + glossary. The only page with `FAQPage` schema.
8. **Contact / Book Equipment** `/contact/` — 11-field project form (incl. GST, role), Call / WhatsApp / sales + general email, head office and bases.

Interlinking is contextual: every answer, project and location links onward to the next logical step (question → machine → application → area → trust → enquiry), plus a page-specific "Where to go next" block.

## 5. Visual system

- **Palette:** graphite ink `#0e1012`, warm stone `#ece8e0` / paper `#f6f4ef`, kiln copper `#c4692c` (accent), steel `#8d949b`. No construction yellow/black.
- **Type:** *Archivo* (variable width, set extra-wide for display — architectural, engineered) · *Instrument Sans* (UI/body) · *Instrument Serif italic* (single editorial accent per heading) · *IBM Plex Mono* (data, labels, readouts). All OFL-licensed, self-hosted, Latin-subset (Archivo cut 90 KB → 29 KB).
- **Wordmark:** "RBE" extra-wide/heavy, hairline rule, "CAPITAL / EQUIP" stacked in tracked caps, the full stop rendered as a solid copper square. Sub-line: "An enterprise of Rotoblast Engineering".
- **Motion language:** one hero centrepiece; everything else is restrained (reveal on scroll, link/arrow micro-motion, map ↔ list highlight). `prefers-reduced-motion` disables pinning and transitions.

## 6. 3D / motion

`src/scripts/backhoe/` — procedural Three.js backhoe loader at real scale (metres) built from extruded engineering profiles. Every hydraulic ram is solved between its two mounting pins each frame, wheels rotate by distance ÷ radius, the body pitches with acceleration, and the rear lifts slightly when stabilisers take load.

Scroll story (pinned, damped): machine reveal → loader bucket lowers and scoops → drives from the plains into a hill road cut with pine cover and distant ranges → stabilisers deploy → backhoe unfolds, digs a trench, swings and dumps spoil → camera pulls back on the site. A live HUD shows travel, boom and dipper angles.

Performance: Three.js loads lazily after first paint (≈150 KB gzip, separate chunk); renders only while the hero is on screen and the tab is visible; mobile uses lower pixel ratio, smaller shadow map and fewer trees. No WebGL / reduced motion → static layout with the same content.

## 7. Technical SEO / AEO / GEO

Static HTML (Astro), clean trailing-slash URLs, one H1 per page, canonical, Open Graph image, sitemap, robots.txt, breadcrumbs (visible + `BreadcrumbList`), `Organization` (with `parentOrganization: Rotoblast Engineering`, `areaServed` for Kumaon + 14 towns), `WebSite`, `WebPage`, `Service`, `FAQPage` (knowledge page only). Entity statement repeated consistently in the footer for AI systems. Answer blocks lead with the direct answer.

## 8. Before launch — checklist

- [x] Phone, WhatsApp, emails in `src/data/site.ts`
- [x] Real domain in `src/data/site-url.mjs`
- [x] Head office address + deployment bases in schema
- [x] Operator policy and service commitments confirmed
- [ ] Add form endpoint (or keep WhatsApp handoff)
- [ ] Machine make/model + real spec sheet → replace the "typical range" table
- [ ] Real photos of the machine at Haldwani/Majkhali and on client sites
- [ ] Google Business Profile — ideally for the Haldwani base (and Majkhali if it is a staffed location) with the same name and numbers
- [ ] Add real machine/site photos (optional but strongly recommended)
- [ ] Create a Google Business Profile with the same name, phone and category
- [ ] Submit `sitemap-index.xml` in Google Search Console
