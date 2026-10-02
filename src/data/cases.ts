/**
 * Real projects RBE Capital Equip. has supplied a machine to.
 *
 * Confirmed by the owner: project names, type of work, location (district),
 * and that RBE supplied a JCB backhoe loader with its operator on both.
 * NOT confirmed (and therefore never shown): client names, dates, duration,
 * value, quantities, the exact machine model, results or performance figures.
 * The rock breaker was used on project work, but which project was not stated,
 * so it is not attributed to either one.
 */
export interface Case {
  id: string;
  name: string;
  work: string;
  place: string;
  district: string;
  project: string; // id in projects.ts this case is evidence for
  supplied: string;
  scope: string[];
  why: string; // what this shows a contractor — no claims beyond the facts above
}

export const cases: Case[] = [
  {
    id: 'ranikhet-majkhali',
    name: 'Ranikhet–Majkhali',
    work: 'Resort development',
    place: 'Ranikhet–Majkhali',
    district: 'Almora',
    project: 'site-development',
    supplied: 'JCB backhoe loader with RBE operator',
    scope: ['Site cutting', 'Levelling'],
    why: 'Resort development in the hills between Ranikhet and Majkhali — sloping ground where a building platform has to be cut and levelled before anything else can start.',
  },
  {
    id: 'padampuri',
    name: 'Padampuri',
    work: 'Road widening',
    place: 'Padampuri',
    district: 'Nainital',
    project: 'road-construction',
    supplied: 'JCB backhoe loader with RBE operator',
    scope: ['Road-widening works'],
    why: 'Road widening in the Nainital hills — work spread along the road, where one wheeled machine that cuts, loads and moves itself to the next stretch keeps the job going.',
  },
];

export const caseFor = (projectId: string) => cases.find((c) => c.project === projectId);
