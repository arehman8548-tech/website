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
    title: 'Hiring, availability and cost',
    intro: 'What procurement teams and project managers ask first.',
    items: [
      {
        id: 'how-quickly',
        q: 'How quickly can I get a backhoe loader for a project in Kumaon?',
        a: 'It depends on two things: whether a machine is free on your start date, and how far your site is. Sites in the plains belt — Rudrapur, Pantnagar, Kashipur, Haldwani — are the quickest to mobilise. Hill sites need the route and arrival planned first. Send the site location, type of work and start date, and we will confirm availability and a realistic mobilisation date before you commit.',
        html: 'It depends on two things: whether a machine is free on your start date, and how far your site is. Sites in the plains belt — Rudrapur, Pantnagar, Kashipur, Haldwani — are the quickest to mobilise. Hill sites need the route and arrival planned first (see <a href="/kumaon-service-area/">how we deploy across Kumaon</a>). <a href="/contact/">Send the site location, type of work and start date</a>, and we will confirm availability and a realistic mobilisation date before you commit.',
      },
      {
        id: 'long-term',
        q: 'Can I hire a backhoe loader for the full duration of my project?',
        a: 'Yes. Rentals can be planned for a short assignment, by the month, or for an entire project phase. For long rentals, servicing schedules and how breakdowns will be handled are agreed before the machine arrives, so availability matches your programme rather than being sorted out mid-project.',
        html: 'Yes. Rentals can be planned for a short assignment, by the month, or for an entire project phase. For long rentals, servicing schedules and how breakdowns will be handled are agreed before the machine arrives, so availability matches your programme rather than being sorted out mid-project. See <a href="/backhoe-loader-rental/#rental-terms">rental durations</a>.',
      },
      {
        id: 'cost',
        q: 'How is backhoe loader rental charged?',
        a: 'Backhoe loader rental in India is usually charged by the hour, by the day/shift or by the month. What changes the cost is the rental duration, working hours per day, whether diesel is included, the operator arrangement, mobilisation distance to your site and how idle time is treated. We quote once we know these, so the number you approve is the number you pay for the agreed scope.',
        html: 'Backhoe loader rental in India is usually charged by the hour, by the day/shift or by the month. What changes the cost is the rental duration, working hours per day, whether diesel is included, the operator arrangement, mobilisation distance to your site and how idle time is treated. We quote once we know these, so the number you approve is the number you pay for the agreed scope. <a href="/contact/">Request a quote</a>.',
      },
      {
        id: 'jcb',
        q: 'Is a “JCB” the same as a backhoe loader?',
        a: 'In India, people often say “JCB” to mean any backhoe loader, because JCB is a well-known manufacturer of them. The machine type itself is a backhoe loader: a wheeled machine with a loader bucket at the front and a digging arm (the backhoe) at the rear. If you are looking for “JCB on rent”, you are almost always looking for a backhoe loader.',
        html: 'In India, people often say “JCB” to mean any backhoe loader, because JCB is a well-known manufacturer of them. The machine type itself is a backhoe loader: a wheeled machine with a loader bucket at the front and a digging arm (the backhoe) at the rear. If you are looking for “JCB on rent”, you are almost always looking for a <a href="/backhoe-loader-rental/">backhoe loader</a>.',
      },
      {
        id: 'quote-info',
        q: 'What information do you need to give me a quote?',
        a: 'Five things: the site location (a map pin is best), the type of work, the expected start date, how long you need the machine and the working hours per day. Road access details — width, sharp bends, last-mile condition — help us plan mobilisation for hill sites. Photos of the site are useful but not required.',
        html: 'Five things: the site location (a map pin is best), the type of work, the expected start date, how long you need the machine and the working hours per day. Road access details — width, sharp bends, last-mile condition — help us plan mobilisation for hill sites. Photos of the site are useful but not required. The <a href="/contact/">enquiry form</a> asks for exactly this.',
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
        a: 'Yes. Backhoe loaders are one of the most common machines on hill road work because they are compact, run on wheels between sites and combine a loader and a digger in one machine. They suit side drains, shoulder and edge work, slip and debris clearance, retaining-wall foundations and culvert excavation. For heavy rock cutting or large-volume slope excavation, a tracked excavator — often with a rock breaker — is usually the main machine, with the backhoe loader supporting it.',
        html: 'Yes. Backhoe loaders are one of the most common machines on hill road work because they are compact, run on wheels between sites and combine a loader and a digger in one machine. They suit side drains, shoulder and edge work, slip and debris clearance, retaining-wall foundations and culvert excavation. For heavy rock cutting or large-volume slope excavation, a tracked excavator — often with a rock breaker — is usually the main machine, with the backhoe loader supporting it. More on <a href="/project-solutions/#road-construction">road construction and widening</a>.',
      },
      {
        id: 'dig-depth',
        q: 'How deep can a backhoe loader dig?',
        a: 'Backhoe loaders in the common 7–8 tonne class typically reach a maximum digging depth of about 4.5 to 6 metres, depending on the model and whether it has an extending dipper. Practical trench depth on site is usually less and depends on soil, shoring and safety requirements. We confirm the exact specification of the machine assigned to your project with the quote.',
        html: 'Backhoe loaders in the common 7–8 tonne class typically reach a maximum digging depth of about 4.5 to 6 metres, depending on the model and whether it has an extending dipper. Practical trench depth on site is usually less and depends on soil, shoring and safety requirements. We confirm the exact specification of the machine assigned to your project with the quote — see <a href="/backhoe-loader-rental/#spec">typical specification</a>.',
      },
      {
        id: 'vs-excavator',
        q: 'Backhoe loader or excavator — which does my project need?',
        a: 'Choose a backhoe loader when you need mobility between work fronts, loading and digging from one machine, and work in tight spaces: trenching, drains, foundations, levelling and loading tippers. Choose a tracked excavator for continuous bulk excavation, deep large-volume cuts and hard rock with a breaker. Many road and site-development projects use both, with the backhoe loader handling everything around the excavator.',
        html: 'Choose a backhoe loader when you need mobility between work fronts, loading and digging from one machine, and work in tight spaces: trenching, drains, foundations, levelling and loading tippers. Choose a tracked excavator for continuous bulk excavation, deep large-volume cuts and hard rock with a breaker. Many road and site-development projects use both, with the backhoe loader handling everything around the excavator. See <a href="/backhoe-loader-rental/#when-not">when a backhoe loader is not the right machine</a>.',
      },
      {
        id: 'hill-cutting',
        q: 'Can a backhoe loader do hill cutting?',
        a: 'For controlled cutting — widening a road edge, cutting a building plot into a slope, benching soil or weathered rock — yes. Large rock faces need an excavator and breaker. On any slope, cutting should follow the project’s engineering design (cut angle, benching, drainage and retaining structures); uncontrolled cutting is how slips start, especially before the monsoon.',
        html: 'For controlled cutting — widening a road edge, cutting a building plot into a slope, benching soil or weathered rock — yes. Large rock faces need an excavator and breaker. On any slope, cutting should follow the project’s engineering design (cut angle, benching, drainage and retaining structures); uncontrolled cutting is how slips start, especially before the monsoon. See <a href="/project-solutions/#hill-cutting">hill cutting and slope work</a>.',
      },
      {
        id: 'monsoon',
        q: 'Can backhoe loaders work in Kumaon during the monsoon?',
        a: 'The machine can work, but the site and the roads decide. From roughly June to September, landslides can close hill roads, soft ground limits where a machine can safely stand, and drainage work becomes urgent. Plan mobilisation before the heavy rains where possible, keep schedule buffer for road closures, and prioritise drainage and slip clearance during the season.',
      },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment and logistics',
    intro: 'Getting the machine to the site — the question outside contractors ask most.',
    items: [
      {
        id: 'remote',
        q: 'Can a backhoe loader be deployed to a remote construction site in Kumaon?',
        a: 'Yes, with planning. For remote sites — around Bageshwar, Berinag or deep in Almora district, for example — we need the exact location, the condition of the access road (width, bends, gradient, last-mile surface), where the machine will be parked overnight, and how diesel and operator stay will be arranged. With that, mobilisation is planned before the start date instead of being worked out on the road.',
        html: 'Yes, with planning. For remote sites — around Bageshwar, Berinag or deep in Almora district, for example — we need the exact location, the condition of the access road (width, bends, gradient, last-mile surface), where the machine will be parked overnight, and how diesel and operator stay will be arranged. With that, mobilisation is planned before the start date instead of being worked out on the road. See <a href="/kumaon-service-area/#deployment">deployment planning</a>.',
      },
      {
        id: 'self-drive',
        q: 'Does a backhoe loader travel to site on its own wheels or on a trailer?',
        a: 'Both happen. A backhoe loader is a wheeled machine and is commonly driven by road over short and moderate distances. For longer moves, or where timing and road conditions make it sensible, it is carried on a trailer. Which method is used depends on distance, route and schedule, and is confirmed as part of the mobilisation plan.',
      },
      {
        id: 'outside',
        q: 'We are a contractor from outside Uttarakhand. Can you support our Kumaon project?',
        a: 'Yes — this is a common situation. Companies coming into Kumaon for road, building or infrastructure contracts often need equipment arranged locally, with someone who understands the routes, the terrain and the seasons. Share your work order scope, site locations and schedule, and we will plan machine availability and mobilisation around it.',
        html: 'Yes — this is a common situation. Companies coming into Kumaon for road, building or infrastructure contracts often need equipment arranged locally, with someone who understands the routes, the terrain and the seasons. Share your work order scope, site locations and schedule, and we will plan machine availability and mobilisation around it. Read <a href="/kumaon-service-area/#outside">working in Kumaon from outside the state</a>.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Breakdowns, servicing and operators',
    intro: 'The questions that decide whether a rental helps the project or slows it.',
    items: [
      {
        id: 'breakdown',
        q: 'What happens if the machine breaks down in the middle of my project?',
        a: 'Breakdowns are the biggest risk in any equipment rental, so we deal with them before work starts. We agree with you how a breakdown is reported, who attends, how long a repair is expected to take, and what happens if it will take longer. You should never have to negotiate this while your site is waiting.',
        html: 'Breakdowns are the biggest risk in any equipment rental, so we deal with them before work starts. We agree with you how a breakdown is reported, who attends, how long a repair is expected to take, and what happens if it will take longer. You should never have to negotiate this while your site is waiting. See <a href="/why-rbe/#support">how we handle support</a>.',
      },
      {
        id: 'servicing',
        q: 'How is servicing handled on long rentals?',
        a: 'Routine servicing is scheduled in advance and timed around your working hours, so planned maintenance does not turn into unplanned downtime. For remote hill sites, consumables and common wear parts are planned before mobilisation.',
      },
      {
        id: 'operator',
        q: 'Does the rental include an operator?',
        a: 'Backhoe loaders are normally rented with an operator, and that is how we plan our rentals. The operator arrangement — shift hours, accommodation at remote sites and what happens on idle days — is confirmed in your quote.',
      },
    ],
  },
  {
    id: 'company',
    title: 'About RBE Capital Equip.',
    intro: 'Who you would be working with.',
    items: [
      {
        id: 'who',
        q: 'Who is RBE Capital Equip.?',
        a: 'RBE Capital Equip. is an equipment rental business that supplies backhoe loaders to construction and infrastructure projects in the Kumaon region of Uttarakhand. It is an enterprise of Rotoblast Engineering, and works with contractors, real-estate developers and infrastructure companies.',
        html: 'RBE Capital Equip. is an equipment rental business that supplies backhoe loaders to construction and infrastructure projects in the Kumaon region of Uttarakhand. It is an enterprise of Rotoblast Engineering, and works with contractors, real-estate developers and infrastructure companies. See <a href="/why-rbe/">why project teams work with RBE</a>.',
      },
      {
        id: 'where',
        q: 'Which areas of Kumaon do you cover?',
        a: 'We support projects across Kumaon — the plains belt of Udham Singh Nagar and Haldwani, the Nainital lake and mid-hill area including Bhimtal, Bhowali, Ramgarh and Mukteshwar, and the inner hills around Almora, Ranikhet, Bageshwar and Berinag. Remote sites are planned case by case.',
        html: 'We support projects across Kumaon — the plains belt of Udham Singh Nagar and Haldwani, the Nainital lake and mid-hill area including Bhimtal, Bhowali, Ramgarh and Mukteshwar, and the inner hills around Almora, Ranikhet, Bageshwar and Berinag. Remote sites are planned case by case. See the <a href="/kumaon-service-area/">Kumaon service area</a>.',
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
];
