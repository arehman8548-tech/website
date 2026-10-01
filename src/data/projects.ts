export interface Project {
  id: string;
  kind: 'road' | 'hill' | 'site' | 'bridge' | 'trench' | 'plains';
  title: string;
  who: string;
  short: string;
  tasks: string[];
  realities: string;
  limits: string;
  where: string[]; // place slugs where this work is common
  faq: string[];
}

export const projects: Project[] = [
  {
    id: 'road-construction',
    kind: 'road',
    title: 'Road construction, widening & highway work',
    who: 'PWD, PMGSY, state highway and NH contractors',
    short: 'Side drains, shoulders, cut edges, culvert pits and debris clearance — the work that runs alongside every kilometre of road.',
    tasks: [
      'Side-drain and catch-water drain excavation',
      'Widening the cut edge and trimming shoulders',
      'Excavation for culverts, scuppers and breast/retaining walls',
      'Loading tippers and clearing slips and debris',
      'Sub-grade preparation and back-filling behind walls',
    ],
    realities:
      'Hill roads give you one lane of working space, live traffic and long distances between work fronts. A wheeled machine that can drive itself between fronts and do both loading and digging lets a small crew keep working without waiting on a second machine.',
    limits:
      'Hard-rock cutting and large-volume formation cutting are excavator and breaker work. On those packages the backhoe loader is the support machine — drains, loading, clearing — not the main cutter.',
    where: ['haldwani', 'bhowali', 'almora', 'bageshwar', 'berinag'],
    faq: ['hill-roads', 'vs-excavator', 'monsoon'],
  },
  {
    id: 'hill-cutting',
    kind: 'hill',
    title: 'Hill cutting & slope work',
    who: 'Site-development and road contractors working on slopes',
    short: 'Controlled cutting and benching in soil and weathered rock, done to the design — not wherever the bucket reaches.',
    tasks: [
      'Benching and terracing slopes for building platforms',
      'Cutting back road edges for widening',
      'Excavating for retaining-wall and breast-wall foundations',
      'Clearing and reshaping slips after rain',
      'Cutting and maintaining drains on each bench',
    ],
    realities:
      'Kumaon slopes are often loose debris over weathered rock. The order of work — drain, cut, retain — matters more than raw digging power, and cutting right before the monsoon without retaining or drainage in place is how slopes fail.',
    limits:
      'Large rock faces and high cuts need a tracked excavator with a breaker. A backhoe loader works best on controlled cuts of moderate height and on the clean-up, drainage and foundation work around them.',
    where: ['nainital', 'bhimtal', 'ramgarh', 'mukteshwar', 'ranikhet'],
    faq: ['hill-cutting', 'monsoon', 'vs-excavator'],
  },
  {
    id: 'site-development',
    kind: 'site',
    title: 'Real-estate & site development',
    who: 'Developers, builders and their civil contractors',
    short: 'From first access road to foundations: clearing, levelling, footings, drainage and back-fill on residential, resort and commercial projects.',
    tasks: [
      'Site clearing and making the first access track',
      'Cutting and levelling building platforms',
      'Footing, raft and column-pit excavation',
      'Drainage, septic, water-tank and service trenches',
      'Back-filling, grading and moving material within the site',
    ],
    realities:
      'Hill plots are narrow and stepped, with little room to park or turn. A backhoe loader can work from the access road, turn within its own length and handle most of the earthwork a typical building plot needs. In the plains, the same machine moves quickly across larger plotted developments.',
    limits:
      'For very large cut-and-fill volumes on township-scale sites, an excavator and tippers should carry the bulk work; the backhoe loader handles footings, services and finishing.',
    where: ['bhimtal', 'ramgarh', 'mukteshwar', 'haldwani', 'rudrapur'],
    faq: ['quote-info', 'site-conditions', 'long-term'],
  },
  {
    id: 'dam-bridge',
    kind: 'bridge',
    title: 'Dam, bridge & river-protection works',
    who: 'Bridge, irrigation, flood-protection and hydro contractors',
    short: 'Abutment and wing-wall excavation, approach fills, and the material handling that keeps a river-side site moving.',
    tasks: [
      'Excavation for abutments, wing walls and small-bridge foundations',
      'Approach-road formation and back-fill',
      'Material handling for gabions and river-training works',
      'Diversion channels and site drainage',
      'Clearing debris after high water',
    ],
    realities:
      'River-side sites in Kumaon are seasonal: work windows close with the monsoon, and access often comes down a steep track to the riverbed. Mobilisation timing and a safe place for the machine above flood level need planning early.',
    limits:
      'Deep foundation work, cofferdams and large-volume river-bed excavation need bigger equipment. Tell us the scope and we will tell you honestly where a backhoe loader fits.',
    where: ['bageshwar', 'almora', 'berinag', 'kathgodam'],
    faq: ['remote', 'difficult-access', 'monsoon'],
  },
  {
    id: 'trenching',
    kind: 'trench',
    title: 'Excavation, trenching & utilities',
    who: 'Water-supply, sewerage, power and telecom contractors',
    short: 'Pipeline, cable and drainage trenches dug to line and depth, with the spoil loaded or back-filled by the same machine.',
    tasks: [
      'Water-supply and sewer pipeline trenches',
      'Cable trenches for power and telecom',
      'Storm-water and roadside drainage',
      'Pit excavation for chambers, tanks and manholes',
      'Back-filling and reinstating after laying',
    ],
    realities:
      'Utility work moves along a road every day. A machine that drives itself to the next stretch, digs, and back-fills with the front bucket is exactly what linear utility work needs — especially where traffic and space are tight.',
    limits:
      'Rock along the trench line slows any backhoe; plan for a breaker where rock is expected. Very deep trenches need shoring and may need an excavator with more reach.',
    where: ['haldwani', 'rudrapur', 'almora', 'nainital'],
    faq: ['dig-depth', 'cost', 'how-quickly'],
  },
  {
    id: 'infrastructure',
    kind: 'plains',
    title: 'Industrial & institutional infrastructure',
    who: 'EPC contractors, industrial developers, institutional projects',
    short: 'Factories, warehouses, campuses and public buildings: levelling, foundations, internal roads and services across the Terai belt and the hills.',
    tasks: [
      'Grading and levelling for sheds, yards and hardstands',
      'Foundation and plinth-beam excavation',
      'Internal roads, kerbs and drains',
      'Service trenches between buildings',
      'Loading and site housekeeping through the build',
    ],
    realities:
      'Industrial estates around Rudrapur, Pantnagar and Kashipur are flat and accessible, so the priority is reliability over a long build programme. Institutional projects in the hills combine that long programme with tight, sloping sites.',
    limits:
      'Large-area mass grading is faster with dozers, graders and excavators. A backhoe loader is the flexible machine that stays on site for foundations, services and everything in between.',
    where: ['rudrapur', 'pantnagar', 'kashipur', 'haldwani'],
    faq: ['long-term', 'duration', 'breakdown'],
  },
];
