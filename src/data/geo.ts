/**
 * Kumaon geography used by the service-area page, map and schema.
 * Coordinates are approximate and only place towns on a schematic map.
 * Altitudes are approximate published reference figures, rounded to 10 m
 * (Berinag: 6,217 ft per Incredible India, Govt. of India). District
 * membership checked against district (nic.in) and Kumaon division sources.
 * Notes describe the kind of work found there — no unverified distances,
 * travel times or road-condition claims.
 */
export type Belt = 'plains' | 'midhills' | 'innerhills';

export interface Place {
  name: string;
  slug: string;
  district: string;
  belt: Belt;
  lat: number;
  lon: number;
  altM: number; // approx. metres above sea level
  note: string; // project-relevant, not tourism copy
}

export const districts = [
  'Nainital',
  'Udham Singh Nagar',
  'Almora',
  'Bageshwar',
  'Pithoragarh',
  'Champawat',
] as const;

export const belts: Record<Belt, { title: string; short: string; realities: string[]; work: string[] }> = {
  plains: {
    title: 'Terai & plains gateway',
    short: 'Rudrapur · Pantnagar · Kashipur · Haldwani · Kathgodam',
    realities: [
      'Flat, open access — the machine can move between sites quickly.',
      'Industrial estates, warehouses, townships and plotted developments.',
      'Monsoon waterlogging and soft ground affect when and how you excavate.',
    ],
    work: ['Site levelling and grading', 'Foundation and footing excavation', 'Drainage and utility trenching', 'Bypass and approach-road work'],
  },
  midhills: {
    title: 'Lake district & mid-hills',
    short: 'Bhimtal · Bhowali · Nainital · Ramgarh · Mukteshwar',
    realities: [
      'Narrow, winding roads with hairpin bends and little room to stage equipment.',
      'Plots are often cut into slopes — retaining walls and drainage come first.',
      'Tight working space suits a compact, wheeled, two-ended machine.',
    ],
    work: ['Slope cutting for building plots', 'Retaining-wall foundation trenches', 'Hill-road shoulder and side-drain work', 'Debris and slip clearance'],
  },
  innerhills: {
    title: 'Inner Kumaon hills',
    short: 'Almora · Ranikhet · Bageshwar · Berinag',
    realities: [
      'Longer mobilisation — the route and timing have to be planned, not improvised.',
      'Remote sites mean servicing and spares need to be arranged before work starts.',
      'Monsoon landslides can close roads for days; schedules need buffer.',
    ],
    work: ['Rural and link-road formation', 'Road widening and side drains', 'Culvert and small-bridge approaches', 'Institutional and project site preparation'],
  },
};

export const places: Place[] = [
  { name: 'Rudrapur', slug: 'rudrapur', district: 'Udham Singh Nagar', belt: 'plains', lat: 28.98, lon: 79.4, altM: 220, note: 'District headquarters of Udham Singh Nagar — industrial, warehousing and urban construction on flat ground.' },
  { name: 'Pantnagar', slug: 'pantnagar', district: 'Udham Singh Nagar', belt: 'plains', lat: 29.02, lon: 79.49, altM: 240, note: 'Industrial estate and university town — factory, warehouse and internal-road construction.' },
  { name: 'Kashipur', slug: 'kashipur', district: 'Udham Singh Nagar', belt: 'plains', lat: 29.21, lon: 78.96, altM: 220, note: 'Industrial and urban growth on the western edge of Kumaon.' },
  { name: 'Haldwani', slug: 'haldwani', district: 'Nainital', belt: 'plains', lat: 29.22, lon: 79.51, altM: 420, note: 'RBE Capital Equip.’s machine deployment base, at the point where the plains meet the Kumaon hills.' },
  { name: 'Kathgodam', slug: 'kathgodam', district: 'Nainital', belt: 'plains', lat: 29.27, lon: 79.54, altM: 550, note: 'Railhead where the plains end and the hill roads begin.' },
  { name: 'Bhimtal', slug: 'bhimtal', district: 'Nainital', belt: 'midhills', lat: 29.34, lon: 79.56, altM: 1370, note: 'Resort, residential and institutional building on sloping plots.' },
  { name: 'Bhowali', slug: 'bhowali', district: 'Nainital', belt: 'midhills', lat: 29.38, lon: 79.52, altM: 1710, note: 'Road junction on the routes to Nainital, Ramgarh and Almora.' },
  { name: 'Nainital', slug: 'nainital', district: 'Nainital', belt: 'midhills', lat: 29.38, lon: 79.46, altM: 1940, note: 'Steep, congested terrain where machine size and access planning matter.' },
  { name: 'Ramgarh', slug: 'ramgarh', district: 'Nainital', belt: 'midhills', lat: 29.44, lon: 79.57, altM: 1520, note: 'Hillside homes and cottages — terracing, retaining walls and access roads.' },
  { name: 'Mukteshwar', slug: 'mukteshwar', district: 'Nainital', belt: 'midhills', lat: 29.47, lon: 79.65, altM: 2170, note: 'High-ridge sites with narrow approach roads and exposed slopes.' },
  { name: 'Ranikhet', slug: 'ranikhet', district: 'Almora', belt: 'innerhills', lat: 29.64, lon: 79.43, altM: 1870, note: 'Cantonment town; road and building work on ridge terrain around it.' },
  { name: 'Almora', slug: 'almora', district: 'Almora', belt: 'innerhills', lat: 29.6, lon: 79.66, altM: 1640, note: 'District headquarters on a ridge — urban works and link roads around it.' },
  { name: 'Bageshwar', slug: 'bageshwar', district: 'Bageshwar', belt: 'innerhills', lat: 29.84, lon: 79.77, altM: 940, note: 'Valley town at a river confluence — road, river-protection and civic works.' },
  { name: 'Berinag', slug: 'berinag', district: 'Pithoragarh', belt: 'innerhills', lat: 29.78, lon: 80.06, altM: 1890, note: 'Remote ridge sites in Pithoragarh district; mobilisation is planned well in advance.' },
];
