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
        q: 'How quickly can a backhoe loader be mobilised to a project in Kumaon?',
        a: 'It depends on two things: whether a machine is free on your start date, and how far and how accessible your site is. RBE Capital Equip. deploys machines from Haldwani, so sites in the plains belt — Haldwani, Rudrapur, Pantnagar, Kashipur — are the simplest to reach. Hill sites need the route and arrival planned first. Send the site location, type of work and start date, and we will tell you availability and a realistic mobilisation date before you commit.',
        html: 'It depends on two things: whether a machine is free on your start date, and how far and how accessible your site is. RBE Capital Equip. deploys machines from Haldwani, so sites in the plains belt — Haldwani, Rudrapur, Pantnagar, Kashipur — are the simplest to reach. Hill sites need the route and arrival planned first (see <a href="/kumaon-service-area/#deployment">what decides mobilisation</a>). <a href="/contact/">Send the site location, type of work and start date</a>, and we will tell you availability and a realistic mobilisation date before you commit.',
      },
      {
        id: 'long-term',
        q: 'Can a backhoe loader be rented for a long-duration infrastructure project?',
        a: 'Yes. A machine can be rented by the month or for an entire contract phase. On a long rental, the terms that matter most are routine servicing (when it happens and how it affects your working hours), how breakdowns are handled, how idle days are charged and how consumables reach a remote site. Settle these in the quote, before the machine is mobilised, rather than mid-project.',
        html: 'Yes. A machine can be rented by the month or for an entire contract phase. On a long rental, the terms that matter most are routine servicing (when it happens and how it affects your working hours), how breakdowns are handled, how idle days are charged and how consumables reach a remote site. Settle these in the quote, before the machine is mobilised, rather than mid-project. See <a href="/backhoe-loader-rental/#rental-terms">rental terms</a>.',
      },
      {
        id: 'duration',
        q: 'How is the rental duration decided?',
        a: 'From the scope of work, not from a fixed package. A defined task such as a set of footings or a drain run may need a few weeks; a road, building or utility package usually needs the machine through a whole phase. Tell us the scope, the working hours per day and your programme dates, and the duration is proposed to match. If the programme moves, an extension or early return is discussed against the agreed terms.',
        html: 'From the scope of work, not from a fixed package. A defined task such as a set of footings or a drain run may need a few weeks; a road, building or utility package usually needs the machine through a whole phase. Tell us the scope, the working hours per day and your programme dates, and the duration is proposed to match. If the programme moves, an extension or early return is discussed against the agreed terms. See <a href="/how-rental-works/">how rental works</a>.',
      },
      {
        id: 'cost',
        q: 'What affects the rental price of a backhoe loader?',
        a: 'In India, backhoe loader rental is usually charged by the hour, by the day or shift, or by the month — monthly rates commonly include a set number of working hours, with extra hours charged separately. The price depends on the duration, working hours per day, whether diesel is included, whether an operator is included, the mobilisation distance and access to your site, and how idle time is treated. We quote once we know these, so you can compare like with like.',
        html: 'In India, backhoe loader rental is usually charged by the hour, by the day or shift, or by the month — monthly rates commonly include a set number of working hours, with extra hours charged separately. The price depends on the duration, working hours per day, whether diesel is included, whether an operator is included, the mobilisation distance and access to your site, and how idle time is treated. We quote once we know these, so you can compare like with like. <a href="/contact/">Request a quote</a>.',
      },
      {
        id: 'quote-info',
        q: 'What information is needed to quote a backhoe loader rental?',
        a: 'Five things: the site location (a map pin is best), the type of work, the expected start date, how long you need the machine and the working hours per day. For hill sites, add the access details — road width, sharp bends, gradient and the last-mile surface. Photos of the site and access road help but are not required.',
        html: 'Five things: the site location (a map pin is best), the type of work, the expected start date, how long you need the machine and the working hours per day. For hill sites, add the access details — road width, sharp bends, gradient and the last-mile surface. Photos of the site and access road help but are not required. The <a href="/contact/">enquiry form</a> asks for exactly this.',
      },
      {
        id: 'jcb',
        q: 'Is a “JCB” the same as a backhoe loader?',
        a: 'Not exactly. JCB is a manufacturer; in India its name is widely used for any backhoe loader. The machine type is a backhoe loader: a wheeled machine with a loader bucket at the front and a digging arm at the rear. If you searched for “JCB on rent”, you are almost always looking for a backhoe loader. RBE Capital Equip. rents backhoe loaders; the make and model of the machine offered for your project is stated in the quote.',
        html: 'Not exactly. JCB is a manufacturer; in India its name is widely used for any backhoe loader. The machine type is a backhoe loader: a wheeled machine with a loader bucket at the front and a digging arm at the rear. If you searched for “JCB on rent”, you are almost always looking for a <a href="/backhoe-loader-rental/">backhoe loader</a>. RBE Capital Equip. rents backhoe loaders; the make and model of the machine offered for your project is stated in the quote.',
      },
    ],
  },
  {
    id: 'terrain',
    title: 'Terrain and machine suitability',
    intro: 'What site engineers want to know before they plan the work.',
    items: [
      {
        id: 'hill-roads',
        q: 'Is a backhoe loader suitable for hill road work in Kumaon?',
        a: 'Yes, for most of the work around the road. Backhoe loaders are widely used on hill roads because they are compact, travel on wheels between work fronts and combine a loader and a digger in one machine. They suit side drains, shoulder and edge work, slip and debris clearance, retaining-wall foundations and culvert excavation. For heavy rock cutting or large-volume formation cutting, a tracked excavator — often with a rock breaker — is usually the main machine, with the backhoe loader supporting it.',
        html: 'Yes, for most of the work around the road. Backhoe loaders are widely used on hill roads because they are compact, travel on wheels between work fronts and combine a loader and a digger in one machine. They suit side drains, shoulder and edge work, slip and debris clearance, retaining-wall foundations and culvert excavation. For heavy rock cutting or large-volume formation cutting, a tracked excavator — often with a rock breaker — is usually the main machine, with the backhoe loader supporting it. More on <a href="/project-solutions/#road-construction">road construction and widening</a>.',
      },
      {
        id: 'vs-excavator',
        q: 'When should an excavator be used instead of a backhoe loader?',
        a: 'Use an excavator when most of the work is heavy digging: continuous bulk excavation, deep large-volume cuts, high formation cuts and hard rock with a breaker. Use a backhoe loader when the work is mixed — digging, loading, back-filling and levelling — spread along a road or across a site, or in tight spaces. Many road and site-development projects use both, with the backhoe loader handling the work around the excavator.',
        html: 'Use an excavator when most of the work is heavy digging: continuous bulk excavation, deep large-volume cuts, high formation cuts and hard rock with a breaker. Use a backhoe loader when the work is mixed — digging, loading, back-filling and levelling — spread along a road or across a site, or in tight spaces. Many road and site-development projects use both, with the backhoe loader handling the work around the excavator. See <a href="/backhoe-loader-rental/#when-not">when a backhoe loader is not the right machine</a>.',
      },
      {
        id: 'hill-cutting',
        q: 'Can a backhoe loader do hill cutting?',
        a: 'For controlled cutting — widening a road edge, cutting a building plot into a slope, benching soil or weathered rock — yes. Large rock faces need an excavator and breaker. On any slope, cutting should follow the project’s engineering design (cut angle, benching, drainage and retaining structures); uncontrolled cutting is how slips start, especially before the monsoon.',
        html: 'For controlled cutting — widening a road edge, cutting a building plot into a slope, benching soil or weathered rock — yes. Large rock faces need an excavator and breaker. On any slope, cutting should follow the project’s engineering design (cut angle, benching, drainage and retaining structures); uncontrolled cutting is how slips start, especially before the monsoon. See <a href="/project-solutions/#hill-cutting">hill cutting and slope work</a>.',
      },
      {
        id: 'dig-depth',
        q: 'How deep can a backhoe loader dig?',
        a: 'As general industry information: backhoe loaders in the common 7–8 tonne class reach a maximum digging depth of roughly 4.5 to 6 metres, depending on the model and whether it has an extending dipper. Practical trench depth on site is usually less and depends on soil, shoring and safety. This is not the specification of a particular RBE machine — the machine offered for your project, and its specification, is stated in the quote.',
        html: 'As general industry information: backhoe loaders in the common 7–8 tonne class reach a maximum digging depth of roughly 4.5 to 6 metres, depending on the model and whether it has an extending dipper. Practical trench depth on site is usually less and depends on soil, shoring and safety. This is not the specification of a particular RBE machine — the machine offered for your project, and its specification, is stated in the quote. See <a href="/backhoe-loader-rental/#spec">typical class ranges</a>.',
      },
      {
        id: 'site-conditions',
        q: 'What site conditions should be checked before a backhoe loader arrives?',
        a: 'Four things: a firm, level place for the machine to stand and put its stabilisers down; enough room to swing the backhoe and turn; what is underground or overhead (pipes, cables, power lines); and the ground itself — loose debris over rock, soft shoulders or waterlogged soil change where and how the machine can safely work. A site contact who knows these, and a safe place to park overnight, keeps the first day productive.',
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
        q: 'Can a backhoe loader be deployed to a remote site in Kumaon?',
        a: 'Often, yes — with planning. For remote sites, for example around Bageshwar, Berinag or deep in Almora district, we need the exact location, the condition of the access road (width, bends, gradient, last-mile surface), where the machine can be parked overnight, and how diesel and the operator’s stay will be arranged. With that, mobilisation is planned before the start date instead of being worked out on the road.',
        html: 'Often, yes — with planning. For remote sites, for example around Bageshwar, Berinag or deep in Almora district, we need the exact location, the condition of the access road (width, bends, gradient, last-mile surface), where the machine can be parked overnight, and how diesel and the operator’s stay will be arranged. With that, mobilisation is planned before the start date instead of being worked out on the road. See <a href="/kumaon-service-area/#deployment">deployment planning</a>.',
      },
      {
        id: 'difficult-access',
        q: 'What happens if the project location is difficult to access?',
        a: 'It is assessed before a date is confirmed. Narrow or damaged roads, tight hairpins, steep or unsurfaced last-mile tracks and seasonal closures can change the travel method, the arrival date or the access work needed before the machine can reach the plot. Share a map pin, photos of the approach and any known restrictions. If a site cannot be reached safely, we will tell you rather than promise a date.',
        html: 'It is assessed before a date is confirmed. Narrow or damaged roads, tight hairpins, steep or unsurfaced last-mile tracks and seasonal closures can change the travel method, the arrival date or the access work needed before the machine can reach the plot. Share a map pin, photos of the approach and any known restrictions on <a href="/contact/">the enquiry form or WhatsApp</a>. If a site cannot be reached safely, we will tell you rather than promise a date.',
      },
      {
        id: 'self-drive',
        q: 'Does a backhoe loader travel to site on its own wheels or on a trailer?',
        a: 'Both happen. A backhoe loader is a wheeled machine and is commonly driven by road over short and moderate distances. For longer moves, or where timing and road conditions make it sensible, it is carried on a trailer. Which method is used depends on distance, route and schedule, and is confirmed as part of the mobilisation plan.',
      },
      {
        id: 'outside',
        q: 'We are a contractor from outside Uttarakhand. Can you support our Kumaon project?',
        a: 'Yes — this is a common situation. Companies coming into Kumaon for road, building or infrastructure contracts often need equipment arranged locally. RBE Capital Equip. deploys from Haldwani, at the foot of the Kumaon hills. Share your work-order scope, site locations and programme, and we will look at machine availability and mobilisation around it.',
        html: 'Yes — this is a common situation. Companies coming into Kumaon for road, building or infrastructure contracts often need equipment arranged locally. RBE Capital Equip. deploys from Haldwani, at the foot of the Kumaon hills. Share your work-order scope, site locations and programme, and we will look at machine availability and mobilisation around it. Read <a href="/kumaon-service-area/#outside">working in Kumaon from outside the state</a>.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Operators and breakdowns',
    intro: 'Terms that decide whether a rental helps the project or slows it.',
    items: [
      {
        id: 'operator',
        q: 'Does the rental include an operator?',
        a: 'In India, backhoe loaders are commonly rented with an operator (“wet hire”), and sometimes as the machine only (“dry hire”), with the hirer providing operator and diesel. The operator arrangement for your rental — shift hours, accommodation at remote sites and what happens on idle days — is stated in your quote.',
      },
      {
        id: 'breakdown',
        q: 'What happens if the machine breaks down in the middle of a project?',
        a: 'That is decided by the rental terms, which is why it should be settled before work starts: how a breakdown is reported, who attends, the expected repair time, whether a replacement is possible and how downtime is charged. Raise it at quote stage and get it in writing, so nobody is negotiating while your site waits.',
        html: 'That is decided by the rental terms, which is why it should be settled before work starts: how a breakdown is reported, who attends, the expected repair time, whether a replacement is possible and how downtime is charged. Raise it at quote stage and get it in writing, so nobody is negotiating while your site waits. See <a href="/why-rbe/#support">what to settle before work starts</a>.',
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
        a: 'RBE Capital Equip. is an equipment rental business that supplies backhoe loaders to construction and infrastructure projects in the Kumaon region of Uttarakhand. It is an enterprise of Rotoblast Engineering and works with contractors, real-estate developers, infrastructure companies and their project and procurement teams.',
        html: 'RBE Capital Equip. is an equipment rental business that supplies backhoe loaders to construction and infrastructure projects in the Kumaon region of Uttarakhand. It is an enterprise of Rotoblast Engineering and works with contractors, real-estate developers, infrastructure companies and their project and procurement teams. See <a href="/why-rbe/">why project teams work with RBE</a>.',
      },
      {
        id: 'based',
        q: 'Where is RBE Capital Equip. based?',
        a: 'Machines are deployed from Haldwani, Uttarakhand, for project sites across Kumaon. The head office is in Sector 27C, Faridabad, Haryana. Enquiries are handled on WhatsApp (+91 78277 28607) and by email (sales@rbecapitalgroup.in).',
        html: 'Machines are deployed from Haldwani, Uttarakhand, for project sites across Kumaon. The head office is in Sector 27C, Faridabad, Haryana. Enquiries are handled on WhatsApp (+91 78277 28607) and by email (sales@rbecapitalgroup.in) — see <a href="/contact/">contact</a>.',
      },
      {
        id: 'where',
        q: 'Which areas of Kumaon do you cover?',
        a: 'Project sites across Kumaon — the plains belt around Haldwani, Rudrapur and Pantnagar; the Nainital lake and mid-hill area including Bhimtal, Bhowali, Ramgarh and Mukteshwar; and the inner hills around Almora, Ranikhet, Bageshwar and Berinag. Remote sites are assessed case by case.',
        html: 'Project sites across Kumaon — the plains belt around Haldwani, Rudrapur and Pantnagar; the Nainital lake and mid-hill area including Bhimtal, Bhowali, Ramgarh and Mukteshwar; and the inner hills around Almora, Ranikhet, Bageshwar and Berinag. Remote sites are assessed case by case. See the <a href="/kumaon-service-area/">Kumaon service area</a>.',
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
  { t: 'Backhoe loader', d: 'A wheeled machine with a loader bucket at the front and a digging arm (backhoe) at the rear. Often called a “JCB” in India, after one manufacturer.' },
  { t: 'Loader end', d: 'The front bucket and lift arms — used for loading, carrying, levelling and back-filling.' },
  { t: 'Backhoe end', d: 'The rear digging arm: boom, dipper (stick) and bucket — used for trenching and excavation.' },
  { t: 'Stabilisers', d: 'Hydraulic legs at the rear that lift and steady the machine while the backhoe digs.' },
  { t: 'Extending dipper', d: 'A telescopic dipper that increases reach and digging depth.' },
  { t: 'Mobilisation', d: 'Getting the machine, operator and support to your site and ready to work.' },
  { t: 'Demobilisation', d: 'Removing the machine from site at the end of the rental.' },
  { t: 'Wet hire / dry hire', d: 'Wet hire: machine with operator (and often diesel). Dry hire: machine only; the hirer provides operator and diesel.' },
  { t: 'Idle time', d: 'Hours or days the machine is on site but not working — how it is charged is agreed in the quote.' },
];
