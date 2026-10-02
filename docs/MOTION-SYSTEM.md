# Motion & 3D system

Every major page has its own scroll-driven scene, built around what that page has to explain. No scene is reused: each has its own world, choreography and camera. All copy stays real HTML (headings, answers, links), so SEO/AEO content is unchanged; the scenes sit behind or beside it.

## Page by page

| Page | Scene (`src/scripts/scenes/`) | What scrolling drives | Replaced |
|---|---|---|---|
| Home | `backhoe/scene.ts` (refined) | Loader crowds a stockpile and dumps → drives into the hills → stabilisers → two IK-driven passes cut a real trench through the road, spoil beside it | Cone trees, flat trench decal; schematic Kumaon map and project cross-sections (now stills rendered from the page scenes) |
| Backhoe Loader | `machine.ts` | Arrives on its own wheels → crowds a stockpile and loads a tipper → reversing 90° turn on the plot → stabilisers → three passes into a 2.4 m footing pit (live pit depth / loader-edge height read from the model) → loaded tipper leaves | Technical side-elevation drawing with callouts |
| Project Solutions | `projects.ts` | Six work sets, one per project type, driven by the article you are reading: hill-road side drain; benching a slope (face retreats, spoil at the toe); back-filling behind a retaining wall with a building frame above; abutment pit beside a live river with gabions; town utility trench with pipes and barricades; grading an industrial plot while a portal-frame shed is erected | Six schematic cross-section diagrams |
| Kumaon Service Area | `kumaon.ts` | Haldwani deployment base → network of corridors draws out → plains → lake district / mid-hills → inner hills → whole region; labels give verified altitude and district | Schematic SVG map and the altitude line graph |
| Why RBE | `yard.ts` | Dawn over the Haldwani base with the site marked on the hills → the machine for the job under floodlights → onto the low-bed → the articulated low-bed leaves through the gate, keeps left along the plain and climbs the cut-and-fill hill road (parapets, km stones) on its true grade → rise behind it to see the road ahead to the site; HUD tracks availability / machine / route / support terms | Support timeline infographic (now plain ruled text) |
| How Rental Works | `journey.ts` | One rental on one hill road: the plot and setting-out → survey of the access road (working area, last-mile surface, sharp bends, road width) → machine at the foot of the road → climbs the hairpins on its own wheels → onto the pad, stabilisers → foundation trench, hour meter running → wide view | Six-step numbered infographic |
| Knowledge | `knowledge.ts` | A small viewer in the topic column shows the situation each topic group is about (dig depth with a depth line, the low-bed, a drain being cut, the base). Desktop only, renders only on scroll | — (answers unchanged) |
| Contact | CSS only | A slowly drifting still of the base at dusk behind the copy; a readiness bar fills as required and helpful enquiry details are entered | — (no WebGL on the conversion page) |

## Factual safety

Scenes only show what the site states. In line with `docs/SEO-CONVERSION-AUDIT.md` §9, nothing implies an inspection routine, fleet size or service-vehicle commitments. Captions say where a scene is illustrative. Kumaon corridors are labelled as indicative, not road alignments.

## Kumaon terrain data (`scripts/geo/build-kumaon.mjs` → `public/geo/`)

- **Elevation:** Terrarium tiles on AWS Open Data (SRTM-derived), z11, resampled to 448×384 over 78.85–80.25°E, 28.80–30.00°N. Vertical scale ×2.2 (stated in the caption).
- **District boundaries:** Census of India 2011 district polygons (datameet/maps): Nainital, Udham Singh Nagar, Almora, Bageshwar, Pithoragarh, Champawat.
- **Rivers:** derived from the DEM (priority-flood + D8 flow accumulation).
- **Corridors:** least-cost paths over the terrain between the towns served. Indicative only.
- Town positions, altitudes and districts come from `src/data/geo.ts`.

## Runtime & performance

- `src/scripts/stage/runtime.ts` loads Three.js and the page's scene **only when the stage comes within one viewport of the screen**, in idle time. Each scene is its own code-split chunk.
- Frames render only while the stage is visible and the tab is active, and only when scroll progress changes (plus short ambient effects: dust settling, river water, Kumaon corridor pulses — disabled on low-power devices).
- Low-power / mobile devices (`lite`) get lower terrain resolution, fewer trees and particles, smaller shadow maps and a capped pixel ratio.
- **Reduced motion, no WebGL, or a failed load:** the stage switches to its static layout — each chapter shown as a realistic still (rendered from the scene, `public/scenes/`) beside its text. Without JavaScript the same static layout is the default.
- Keyboard: focusing a link inside a chapter scrolls the story to that chapter.

## Adding or changing a scene

1. Write `src/scripts/scenes/<name>.ts` exporting `create: Factory` (see `runtime.ts` for the interface) and register it in `runtime.ts`.
2. Use `<ScrollStage scene="<name>" chapters={…} />` on the page (or `data-stage` + `data-mode="track"` for article-driven scenes).
3. Re-render stills with `npm run stills <name>`.
