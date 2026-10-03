/**
 * Knowledge base. Every question is one a contractor, developer, site engineer
 * or procurement team actually asks before hiring. Answers lead with the direct
 * answer (for people and for answer engines), then the useful detail.
 *
 * `a` is the plain-text answer used in FAQPage schema; `html` (optional) is the
 * on-page version with contextual links. Keep them saying the same thing.
 */
export interface QA {
  id: string;
  q: string;
  a: string;
  html?: string;
}
export interface FaqGroup {
  id: string;
  title: string;
  intro: string;
  items: QA[];
}

export const faq: FaqGroup[] = [
  {
    id: 'hiring',
    title: 'Hiring, terms and cost',
    intro: 'What procurement teams and project managers ask first.',
    items: [
      {
        id: 'minimum',
        q: 'What is the minimum rental period?',
        a: 'Fifteen days. RBE Capital Equip. rents for 15 days or more — by the month or for a full project phase — and does not hire out by the hour or the day. Getting a machine to a Kumaon site, especially in the hills, takes planning; a minimum period keeps the machine committed to one project instead of moving between short jobs.',
        html: 'Fifteen days. RBE Capital Equip. rents for 15 days or more — by the month or for a full project phase — and does not hire out by the hour or the day. Getting a machine to a Kumaon site, especially in the hills, takes planning; a minimum period keeps the machine committed to one project instead of moving between short jobs. See <a href="/backhoe-loader-rental/#rental-terms">rental terms</a>.',
      },
      {
        id: 'operator',
        q: 'Does the rental include an operator?',
        a: 'Yes, always. Every RBE rental is supplied with an operator. Shift hours, the operator’s stay at remote sites and how idle days are treated are written into your quote before the machine is dispatched.',
      },
      {
        id: 'cost',
        q: 'How is backhoe loader rental charged?',
        a: 'Online you will mostly see hourly or daily “JCB rent” rates. Those are for short local jobs. RBE rents for a minimum of 15 days, so a quote is for a period — usually monthly or the project phase. What moves the price is the duration, working hours per day, whether diesel is included, mobilisation distance to your site, idle-time terms and whether you need the rock breaker. All of these are stated in writing before the machine is dispatched. GST invoice is available on request.',
        html: 'Online you will mostly see hourly or daily “JCB rent” rates. Those are for short local jobs. RBE rents for a <a href="/knowledge/#minimum">minimum of 15 days</a>, so a quote is for a period — usually monthly or the project phase. What moves the price is the duration, working hours per day, whether diesel is included, mobilisation distance to your site, idle-time terms and whether you need the rock breaker. All of these are stated in writing before the machine is dispatched. GST invoice is available on request. See <a href="/jcb-rental-rates/">how JCB rental is priced</a> or <a href="/contact/">request a quote</a>.',
      },
      {
        id: 'gst',
        q: 'Can you provide a GST invoice?',
        a: 'Yes. A GST invoice is available on request — mention it when you ask for a quote so billing is set up correctly from the first invoice.',
        html: 'Yes. A GST invoice is available on request — mention it when you ask for a quote (the <a href="/contact/">enquiry form</a> has a field for it) so billing is set up correctly from the first invoice.',
      },
      {
        id: 'quote-info',
        q: 'What information do you need to give me a quote?',
        a: 'Five things: the site location (a map pin is best), the type of work, the start date, how long you need the machine (15 days minimum) and the working hours per day. For hill sites, also tell us about the access road — width, sharp bends and the last stretch to the site. Photos help but are not required. If you need a GST invoice or the rock breaker, say so at the start.',
        html: 'Five things: the site location (a map pin is best), the type of work, the start date, how long you need the machine (15 days minimum) and the working hours per day. For hill sites, also tell us about the access road — width, sharp bends and the last stretch to the site. Photos help but are not required. If you need a GST invoice or the rock breaker, say so at the start. The <a href="/contact/">enquiry form</a> asks for exactly this.',
      },
      {
        id: 'how-quickly',
        q: 'How quickly can I get a backhoe loader on my site?',
        a: 'Two things decide it: whether the machine is free for your dates, and how far your site is from Haldwani or Majkhali, the two places RBE dispatches from. Sites around Haldwani and the plains, or around Ranikhet and Almora, are the shortest moves. Remote sites need the route planned first. Send the location, type of work and start date, and RBE confirms availability and an arrival date before you commit.',
        html: 'Two things decide it: whether the machine is free for your dates, and how far your site is from Haldwani or Majkhali, the two places RBE dispatches from. Sites around Haldwani and the plains, or around Ranikhet and Almora, are the shortest moves. Remote sites need the route planned first (see <a href="/kumaon-service-area/#deployment">deployment planning</a>). <a href="/contact/">Send the location, type of work and start date</a>, and RBE confirms availability and an arrival date before you commit.',
      },
      {
        id: 'long-term',
        q: 'Can I hire a backhoe loader for the full duration of my project?',
        a: 'Yes — that is the kind of rental RBE is set up for. Hire runs from a 15-day minimum to monthly or the full project phase. For long rentals, how breakdowns are reported and handled is agreed in writing before the machine arrives, so it is not something you negotiate while your site waits.',
        html: 'Yes — that is the kind of rental RBE is set up for. Hire runs from a 15-day minimum to monthly or the full project phase. For long rentals, how breakdowns are reported and handled is agreed in writing before the machine arrives, so it is not something you negotiate while your site waits. See <a href="/backhoe-loader-rental/#rental-terms">rental terms</a>.',
      },
      {
        id: 'per-hour',
        q: 'Do you rent a JCB per hour or per day?',
        a: 'No. RBE’s minimum rental is 15 days, priced for the period — 15 days, monthly or the project phase — with the working hours per day written into the quote. Hourly “JCB rent” rates seen online are for short local jobs. If your work order or BOQ counts machine-hours, tell us the expected hours per day and RBE quotes the period on that basis.',
        html: 'No. RBE’s minimum rental is 15 days, priced for the period — 15 days, monthly or the project phase — with the working hours per day written into the quote. Hourly “JCB rent” rates seen online are for short local jobs. If your work order or BOQ counts machine-hours, tell us the expected hours per day and RBE quotes the period on that basis. See <a href="/jcb-rental-rates/">how JCB rental is priced</a>.',
      },
      {
        id: '3dx',
        q: 'Can I rent a JCB 3DX?',
        a: '3DX is the name of one JCB backhoe loader model, and many people use it to mean a standard backhoe loader. RBE supplies JCB backhoe loaders across a range of models; the model sent depends on your project and on availability for your dates. If your contract specifies a model or machine class, say so in the enquiry — the quote states the model supplied.',
        html: '3DX is the name of one JCB backhoe loader model, and many people use it to mean a standard backhoe loader. RBE supplies JCB backhoe loaders across a range of models; the model sent depends on your project and on availability for your dates. If your contract specifies a model or machine class, say so in the <a href="/contact/">enquiry</a> — the quote states the model supplied. See <a href="/jcb-rental-rates/#3dx">3DX rent price</a>.',
      },
      {
        id: 'pwd',
        q: 'Can a contractor hire a JCB from RBE for a PWD or government work order?',
        a: 'Yes — RBE rents a JCB backhoe loader with operator to the contractor executing the work, on the same terms as any project: 15 days minimum, operator included, GST invoice on request. Send the district and site, the scope items that need the machine, the period, working hours per day and start date. This is equipment hire, not a tender listing, and RBE does not claim any government registration or contract; the hire is between RBE and your company.',
        html: 'Yes — RBE rents a JCB backhoe loader with operator to the contractor executing the work, on the same terms as any project: 15 days minimum, operator included, GST invoice on request. Send the district and site, the scope items that need the machine, the period, working hours per day and start date. This is equipment hire, not a tender listing, and RBE does not claim any government registration or contract; the hire is between RBE and your company. See <a href="/contractors/#procurement">hiring for a government work order</a>.',
      },
      {
        id: 'jcb',
        q: 'Is a “JCB” the same as a backhoe loader?',
        a: 'Mostly, yes. In India people say “JCB” for any backhoe loader, because JCB is the best-known maker of them. The machine type is a backhoe loader: wheeled, with a loader bucket at the front and a digging arm at the rear. If you are searching for “JCB on rent” for a construction project, a backhoe loader is what you are looking for. RBE’s machines are JCB-make backhoe loaders across a range of models; the model supplied depends on your project and availability. (Some people also say “JCB” for a tracked excavator — if that is what your work needs, tell us and we will say so plainly.)',
        html: 'Mostly, yes. In India people say “JCB” for any backhoe loader, because JCB is the best-known maker of them. The machine type is a <a href="/backhoe-loader-rental/">backhoe loader</a>: wheeled, with a loader bucket at the front and a digging arm at the rear. If you are searching for “JCB on rent” for a construction project, a backhoe loader is what you are looking for. RBE’s machines are JCB-make backhoe loaders across a range of models; the model supplied depends on your project and availability. (Some people also say “JCB” for a tracked excavator — if <a href="/backhoe-loader-rental/#when-not">that is what your work needs</a>, tell us and we will say so plainly.)',
      },
    ],
  },
  {
    id: 'terrain',
    title: 'Terrain and machine capability',
    intro: 'What site engineers want to know before they plan the work.',
    items: [
      {
        id: 'hill-roads',
        q: 'Can a backhoe loader be used for hill road projects in Kumaon?',
        a: 'Yes. Backhoe loaders are among the most common machines on hill road work: compact, road-going, and a loader and digger in one. They suit side drains, shoulder and edge work, slip and debris clearance, retaining-wall foundations and culvert excavation. For heavy rock cutting or large-volume slope excavation, a tracked excavator is usually the main machine, with the backhoe loader supporting it.',
        html: 'Yes. Backhoe loaders are among the most common machines on hill road work: compact, road-going, and a loader and digger in one. They suit side drains, shoulder and edge work, slip and debris clearance, retaining-wall foundations and culvert excavation. For heavy rock cutting or large-volume slope excavation, a tracked excavator is usually the main machine, with the backhoe loader supporting it. More on <a href="/project-solutions/#road-construction">road construction and widening</a>.',
      },
      {
        id: 'hill-cutting',
        q: 'Can a backhoe loader do hill cutting?',
        a: 'For controlled cutting — widening a road edge, cutting a building plot into a slope, benching soil or weathered rock — yes. Where harder rock turns up, RBE has a hydraulic rock breaker. High rock faces and bulk formation cutting still need a tracked excavator. Any slope cut should follow the project’s design (cut angle, benching, drainage, retaining walls); uncontrolled cutting is how slips start, especially before the monsoon.',
        html: 'For controlled cutting — widening a road edge, cutting a building plot into a slope, benching soil or weathered rock — yes. Where harder rock turns up, RBE has a <a href="/knowledge/#breaker">hydraulic rock breaker</a>. High rock faces and bulk formation cutting still need a tracked excavator. Any slope cut should follow the project’s design (cut angle, benching, drainage, retaining walls); uncontrolled cutting is how slips start, especially before the monsoon. See <a href="/project-solutions/#hill-cutting">hill cutting and slope work</a>.',
      },
      {
        id: 'breaker',
        q: 'Do you have a rock breaker?',
        a: 'Yes. RBE has a hydraulic rock breaker. If your trench line, drain or road edge runs into rock, mention it in your enquiry so the breaker and its dates are included in the quote. For large rock faces or continuous rock excavation, a tracked excavator with a breaker is still the right main machine.',
        html: 'Yes. RBE has a hydraulic rock breaker. If your trench line, drain or road edge runs into rock, mention it in your <a href="/contact/">enquiry</a> so the breaker and its dates are included in the quote. For large rock faces or continuous rock excavation, a tracked excavator with a breaker is still the <a href="/backhoe-loader-rental/#when-not">right main machine</a>.',
      },
      {
        id: 'vs-excavator',
        q: 'Backhoe loader or excavator — which does my project need?',
        a: 'Choose a backhoe loader when you need mobility between work fronts, loading and digging from one machine, and work in tight spaces: trenching, drains, foundations, levelling and loading tippers. Choose a tracked excavator for continuous bulk excavation, deep large-volume cuts and heavy rock work. Many road and site-development projects use both, with the backhoe loader handling everything around the excavator. RBE rents backhoe loaders only, and will tell you if your scope needs an excavator.',
        html: 'Choose a backhoe loader when you need mobility between work fronts, loading and digging from one machine, and work in tight spaces: trenching, drains, foundations, levelling and loading tippers. Choose a tracked excavator for continuous bulk excavation, deep large-volume cuts and heavy rock work. Many road and site-development projects use both, with the backhoe loader handling everything around the excavator. RBE rents backhoe loaders only, and will tell you if your scope needs an excavator. See <a href="/backhoe-loader-rental/#when-not">when a backhoe loader is not the right machine</a>.',
      },
      {
        id: 'dig-depth',
        q: 'How deep can a backhoe loader dig?',
        a: 'Backhoe loaders in the common 7–8 tonne class typically reach a maximum digging depth of about 4.5 to 6 metres, depending on the model and whether it has an extending dipper. Practical trench depth on site is usually less and depends on soil, shoring and safety. RBE supplies JCB backhoe loaders across a range of models, so the model and its specification are confirmed in your quote.',
        html: 'Backhoe loaders in the common 7–8 tonne class typically reach a maximum digging depth of about 4.5 to 6 metres, depending on the model and whether it has an extending dipper. Practical trench depth on site is usually less and depends on soil, shoring and safety. RBE supplies JCB backhoe loaders across a range of models, so the model and its specification are confirmed in your quote — see <a href="/backhoe-loader-rental/#spec">typical specification</a>.',
      },
      {
        id: 'monsoon',
        q: 'Can backhoe loaders work in Kumaon during the monsoon?',
        a: 'The machine can work, but the site and the roads decide. From roughly June to September, landslides can close hill roads, soft ground limits where a machine can safely stand, and drainage work becomes urgent. Mobilise before the heavy rains where possible, keep schedule buffer for road closures, and prioritise drainage and slip clearance during the season.',
      },
    ],
  },
  {
    id: 'local',
    title: 'Haldwani, Ranikhet and the rest of Kumaon',
    intro: 'Where the machine comes from, and which sites it can reach.',
    items: [
      {
        id: 'haldwani',
        q: 'Do you rent backhoe loaders in Haldwani?',
        a: 'Yes. Haldwani is one of RBE’s two deployment bases, so projects in and around Haldwani, Kathgodam, Lalkuan and the Udham Singh Nagar plains are a short move. Rentals are for 15 days or more and always include an operator — RBE does not take hourly or one-day jobs.',
        html: 'Yes. Haldwani is one of RBE’s two deployment bases, so projects in and around Haldwani, Kathgodam, Lalkuan and the Udham Singh Nagar plains are a short move. Rentals are for <a href="/knowledge/#minimum">15 days or more</a> and always include an operator — RBE does not take hourly or one-day jobs. See <a href="/kumaon-service-area/#haldwani">Haldwani</a> and the <a href="/kumaon-service-area/#belt-plains">plains belt</a>.',
      },
      {
        id: 'ranikhet',
        q: 'Can I get a backhoe loader near Ranikhet or Almora without bringing it up from the plains?',
        a: 'Yes. RBE’s second base is at Majkhali, about 10 km from Ranikhet on the Ranikhet–Almora road. For sites around Ranikhet, Almora, Dwarahat or further into the inner hills, the machine starts already in the hills instead of climbing up from Haldwani.',
        html: 'Yes. RBE’s second base is at <a href="/kumaon-service-area/#majkhali">Majkhali</a>, about 10 km from Ranikhet on the Ranikhet–Almora road. For sites around Ranikhet, Almora, Dwarahat or further into the inner hills, the machine starts already in the hills instead of climbing up from Haldwani. See the <a href="/kumaon-service-area/#belt-innerhills">inner hills</a>.',
      },
      {
        id: 'where',
        q: 'Which areas of Kumaon do you cover?',
        a: 'Projects across Kumaon’s six districts — Nainital, Udham Singh Nagar, Almora, Bageshwar, Pithoragarh and Champawat. That includes the plains around Haldwani, Rudrapur and Kashipur; the lake and mid-hill area around Bhimtal, Bhowali, Nainital, Ramgarh and Mukteshwar; and the inner hills around Ranikhet, Almora, Bageshwar and Berinag. The machine is dispatched from Haldwani or Majkhali (Ranikhet); remote sites are planned case by case.',
        html: 'Projects across Kumaon’s six districts — Nainital, Udham Singh Nagar, Almora, Bageshwar, Pithoragarh and Champawat. That includes the plains around Haldwani, Rudrapur and Kashipur; the lake and mid-hill area around Bhimtal, Bhowali, Nainital, Ramgarh and Mukteshwar; and the inner hills around Ranikhet, Almora, Bageshwar and Berinag. The machine is dispatched from Haldwani or Majkhali (Ranikhet); remote sites are planned case by case. See the <a href="/kumaon-service-area/">Kumaon service area</a>.',
      },
      {
        id: 'outside',
        q: 'We are a contractor from outside Uttarakhand. Can you support our Kumaon project?',
        a: 'Yes. Companies from Delhi NCR and elsewhere win road, building and infrastructure work in Kumaon but often have no equipment or contacts in the hills. RBE’s head office is in Plot No 71A, Sector 27C, Faridabad, and the machine is dispatched from Haldwani and Majkhali (Ranikhet). Share your work-order scope, site locations and programme; RBE confirms availability, mobilisation and terms in writing.',
        html: 'Yes. Companies from Delhi NCR and elsewhere win road, building and infrastructure work in Kumaon but often have no equipment or contacts in the hills. RBE’s head office is in Plot No 71A, Sector 27C, Faridabad, and the machine is dispatched from Haldwani and Majkhali (Ranikhet). Share your work-order scope, site locations and programme; RBE confirms availability, mobilisation and terms in writing. Read <a href="/kumaon-service-area/#outside">working in Kumaon from outside the state</a>.',
      },
      {
        id: 'remote',
        q: 'Can a backhoe loader be deployed to a remote construction site in Kumaon?',
        a: 'Yes, with planning. For remote sites — around Bageshwar, Berinag or deep in Almora district, for example — RBE needs the exact location, the condition of the access road (width, bends, gradient, last stretch), where the machine will park overnight, and how diesel and the operator’s stay will be arranged. With that, mobilisation is planned before the start date instead of being worked out on the road.',
        html: 'Yes, with planning. For remote sites — around Bageshwar, Berinag or deep in Almora district, for example — RBE needs the exact location, the condition of the access road (width, bends, gradient, last stretch), where the machine will park overnight, and how diesel and the operator’s stay will be arranged. With that, mobilisation is planned before the start date instead of being worked out on the road. See <a href="/kumaon-service-area/#deployment">deployment planning</a>.',
      },
      {
        id: 'self-drive',
        q: 'Does a backhoe loader travel to site on its own wheels or on a trailer?',
        a: 'Both are common. A backhoe loader is road-going, so it is often driven over short and moderate distances. For longer moves, or where timing and road conditions make it sensible, it goes on a trailer. Which one applies to your site is confirmed as part of the mobilisation plan.',
      },
    ],
  },
  {
    id: 'urgent',
    title: 'Emergency clearance',
    intro: 'Slips, boulders, flood debris and blocked roads.',
    items: [
      {
        id: 'landslide',
        q: 'Can RBE send a JCB for landslide or slip clearance?',
        a: 'Yes. RBE provides landslide and slip clearance, boulder and rock clearance, flood and drainage emergency earthwork, and road-blockage clearance with a JCB backhoe loader and operator. The loader bucket clears and loads debris, the backhoe pulls loose material down in controlled passes and reopens choked drains, and RBE’s hydraulic rock breaker deals with boulders too big to lift. Large slides and unstable faces need a tracked excavator and the site authority’s go-ahead. Whether a machine can reach you, and when, depends on where it is working and which roads are open — RBE confirms both on the call.',
        html: 'Yes. RBE provides landslide and slip clearance, boulder and rock clearance, flood and drainage emergency earthwork, and road-blockage clearance with a JCB backhoe loader and operator. The loader bucket clears and loads debris, the backhoe pulls loose material down in controlled passes and reopens choked drains, and RBE’s hydraulic rock breaker deals with boulders too big to lift. Large slides and unstable faces need a tracked excavator and the site authority’s go-ahead. Whether a machine can reach you, and when, depends on where it is working and which roads are open — RBE confirms both on the call. See <a href="/emergency-earthwork/">emergency earthwork &amp; road clearance</a>.',
      },
      {
        id: 'urgent-contact',
        q: 'Who do I call for urgent road or slip clearance?',
        a: 'Call Site Coordination on +91 98110 30794 with the location and what is blocking the road or site, then WhatsApp photos and a map pin to +91 78277 28607. Enquiry hours are 8:00 AM to 8:00 PM. RBE confirms machine availability, the route and the terms on the call; no arrival time is promised before that.',
        html: 'Call Site Coordination on <a href="tel:+919811030794">+91 98110 30794</a> with the location and what is blocking the road or site, then WhatsApp photos and a map pin to +91 78277 28607. Enquiry hours are 8:00 AM to 8:00 PM. RBE confirms machine availability, the route and the terms on the call; no arrival time is promised before that. See <a href="/emergency-earthwork/#request">how to request urgent assistance</a>.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Breakdowns and support',
    intro: 'The questions that decide whether a rental helps the project or slows it.',
    items: [
      {
        id: 'breakdown',
        q: 'What happens if the machine breaks down in the middle of my project?',
        a: 'This is settled before work starts, not after. RBE agrees with you in writing how a breakdown is reported, who attends, and what happens if a repair is going to take longer. The machine is also checked before it is dispatched, so problems are found in the yard rather than on your site.',
        html: 'This is settled before work starts, not after. RBE agrees with you in writing how a breakdown is reported, who attends, and what happens if a repair is going to take longer. The machine is also checked before it is dispatched, so problems are found in the yard rather than on your site. See <a href="/why-rbe/#support">how support is agreed</a>.',
      },
      {
        id: 'contact-person',
        q: 'Who do I deal with during the rental?',
        a: 'One named point of contact at RBE handles your project from quote to return — availability, mobilisation, daily coordination, breakdowns and extension. You do not have to find the right person each time something comes up.',
      },
    ],
  },
  {
    id: 'company',
    title: 'About RBE Capital Equip.',
    intro: 'Who you would be working with.',
    items: [
      {
        id: 'projects',
        q: 'Has RBE worked on projects in the Kumaon hills?',
        a: 'Yes. Two examples: a resort development between Ranikhet and Majkhali in Almora district, where RBE supplied a JCB backhoe loader with operator for site cutting and levelling; and the Padampuri road-widening project in Nainital district, where RBE supplied a JCB backhoe loader with operator for the widening works. Photographs from both sites are on this website.',
        html: 'Yes. Two examples: a resort development between Ranikhet and Majkhali in Almora district, where RBE supplied a JCB backhoe loader with operator for site cutting and levelling; and the Padampuri road-widening project in Nainital district, where RBE supplied a JCB backhoe loader with operator for the widening works. See the photographs under <a href="/project-solutions/#site-development">site development</a> and <a href="/project-solutions/#road-construction">road construction</a>.',
      },
      {
        id: 'who',
        q: 'Who is RBE Capital Equip.?',
        a: 'RBE Capital Equip. is an enterprise of Rotoblast Engineering. It rents JCB backhoe loaders — across a range of models, depending on the project and availability — always with an operator and for a minimum of 15 days, to contractors, developers and infrastructure companies building in Kumaon, Uttarakhand. The head office is in Plot No 71A, Sector 27C, Faridabad, Haryana; the machine is dispatched from Haldwani and Majkhali near Ranikhet.',
        html: 'RBE Capital Equip. is an enterprise of Rotoblast Engineering. It rents JCB backhoe loaders — across a range of models, depending on the project and availability — always with an operator and for a minimum of 15 days, to contractors, developers and infrastructure companies building in Kumaon, Uttarakhand. The head office is in Plot No 71A, Sector 27C, Faridabad, Haryana; the machine is dispatched from Haldwani and Majkhali near Ranikhet. See <a href="/why-rbe/">what you can expect from RBE</a>.',
      },
    ],
  },
];

export const allQA = faq.flatMap((g) => g.items);
export const qa = (id: string) => {
  const x = allQA.find((i) => i.id === id);
  if (!x) throw new Error(`Unknown FAQ id ${id}`);
  return x;
};

export const glossary = [
  { t: 'Backhoe loader', d: 'A wheeled machine with a loader bucket at the front and a digging arm (backhoe) at the rear. Often called a “JCB” in India.' },
  { t: 'Loader end', d: 'The front bucket and lift arms — used for loading, carrying, levelling and back-filling.' },
  { t: 'Backhoe end', d: 'The rear digging arm: boom, dipper (stick) and bucket — used for trenching and excavation.' },
  { t: 'Stabilisers', d: 'Hydraulic legs at the rear that lift and steady the machine while the backhoe digs.' },
  { t: 'Extending dipper', d: 'A telescopic dipper that increases reach and digging depth.' },
  { t: 'Mobilisation', d: 'Getting the machine, operator and support to your site and ready to work.' },
  { t: 'Demobilisation', d: 'Removing the machine from site at the end of the rental.' },
  { t: 'Idle time', d: 'Hours or days the machine is on site but not working — how it is charged is agreed in the quote.' },
  { t: 'Minimum rental period', d: 'The shortest hire RBE accepts: 15 days.' },
  { t: 'Hydraulic rock breaker', d: 'A hammer attachment for breaking rock that a bucket cannot dig.' },
  { t: 'Deployment base', d: 'Where the machine is dispatched from. RBE has two: Haldwani and Majkhali (Ranikhet).' },
];
