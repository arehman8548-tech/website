# RBE Capital Equip. — site strategy

How the site was planned: the business, the research, the structure, and what still needs confirming before launch.

## 1. Business proposition

**RBE Capital Equip.** (an enterprise of **Rotoblast Engineering**) rents **backhoe loaders** to contractors, developers and infrastructure companies running construction projects in **Kumaon, Uttarakhand**.

The site has to answer one buyer question: *"Can these people actually support my project in difficult terrain?"* It does that by covering, in order: **recognition → problem → capability → suitability → trust → availability → contact**.

### Business facts (verified, supplied by the business)

| Item | On the site |
|---|---|
| WhatsApp | +91 78277 28607 (`wa.me/917827728607`) — the primary fast-response route |
| Email | sales@rotoblasteng.com (sales/quotes) · arehman@rotoblasteng.com (direct) |
| Machine deployment base | Haldwani, Uttarakhand (not an office address) |
| Head office | Sector 27C, Faridabad, Haryana, India (no street/PIN supplied — none invented) |
| Phone line | None supplied → no Call buttons, no `telephone` in schema |
| Domain | Not supplied → set `SITE_URL` at build time (see `src/data/site-url.mjs`) |
| Fleet, years, clients, certifications, operator policy, service commitments | Not supplied → not claimed. Specs shown only as labelled general industry ranges |

See `docs/SEO-CONVERSION-AUDIT.md` for the October 2026 audit that replaced the earlier placeholder values.

Research note: public listings show a *Rotoblast Engineering* in Delhi/Faridabad (shot-blasting machinery, operating since ~2000). That was **not** confirmed as the same organisation, so the site states only the relationship ("an enterprise of Rotoblast Engineering"), with no heritage details.

## 2. Research summary

**Geography (verified):** Kumaon division = 6 districts: Nainital, Udham Singh Nagar, Almora, Bageshwar, Pithoragarh, Champawat. "Berinath" in the brief = **Berinag** (Pithoragarh district, ~1,860 m). Altitudes run from ~210 m (Rudrapur) to ~2,280 m (Mukteshwar), so the site organises locations into three **terrain belts** instead of a city list:

- **Terai & plains gateway** — Rudrapur, Pantnagar, Kashipur, Haldwani, Kathgodam
- **Lake district & mid-hills** — Bhimtal, Bhowali, Nainital, Ramgarh, Mukteshwar
- **Inner hills** — Ranikhet, Almora, Bageshwar, Berinag

**Market context:** active state road programmes (PWD network expansion, rural road upgrades, Rudrapur/Kashipur bypasses, temple-circuit road widening in Kumaon), industrial estates in Udham Singh Nagar, hill real estate around Bhimtal–Ramgarh–Mukteshwar.

**Competitor landscape:** local listings (IndiaMART/aggregators) and generic national rental marketplaces. They compete on price per hour and "JCB on rent". None explains terrain, mobilisation, breakdown handling or machine fit. That gap is RBE's positioning.

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
| Price | JCB rent per hour Haldwani | `/knowledge/#cost` explains the cost basis honestly (no invented rates) |

Deliberately **not** targeted: home/garden digging, agricultural, one-off residential jobs.

## 4. Information architecture (8 pages)

1. **Home** `/` — conversion + brand; 3D scroll story; buyer concerns; audiences; project types; Kumaon; process; Rotoblast; direct answers.
2. **Backhoe Loader** `/backhoe-loader-rental/` — machine anatomy, tasks, typical spec, honest limits, hill suitability, rental terms. `Service` schema.
3. **Project Solutions** `/project-solutions/` — 6 project types, each: tasks, Kumaon realities, where it stops, nearby locations, related questions.
4. **Kumaon Service Area** `/kumaon-service-area/` — map, altitude profile, 3 belts, 14 location cards, deployment factors, guidance for outside contractors.
5. **Why RBE** `/why-rbe/` — partner vs machine-on-hire, support plan, Rotoblast relationship, what we won't do.
6. **How Rental Works** `/how-rental-works/` — 6 steps with outcomes; 5 things needed for a fast quote.
7. **Knowledge** `/knowledge/` — 21 buyer questions in 5 groups + glossary. The only page with `FAQPage` schema.
8. **Contact / Book Equipment** `/contact/` — 9-field project form, WhatsApp / Email (no phone line supplied).

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

Static HTML (Astro), clean trailing-slash URLs, one H1 per page, canonical, Open Graph image, sitemap, robots.txt, breadcrumbs (visible + `BreadcrumbList`), `Organization` (with `parentOrganization: Rotoblast Engineering`, head-office address, `areaServed` for Kumaon + 14 towns), `WebSite`, `WebPage`, `Service`, `FAQPage` (knowledge page only). Entity statement repeated consistently in the footer for AI systems. Answer blocks lead with the direct answer.

## 8. Before launch — checklist

- [x] WhatsApp and email set in `src/data/site.ts`
- [ ] Build with `SITE_URL=https://<verified-domain>`
- [ ] Add form endpoint (or keep WhatsApp handoff)
- [ ] Only if a genuine public premises exists: consider `LocalBusiness`
- [ ] If the business confirms an operator policy or service commitments, they can be stated (currently not claimed)
- [ ] Add real machine/site photos (optional but strongly recommended)
- [ ] Google Business Profile: only as a service-area business with a genuine address, using the same name and contacts
- [ ] Submit `sitemap-index.xml` in Google Search Console
