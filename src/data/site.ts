import { SITE_URL } from './site-url.mjs';

/**
 * Single source of truth for business facts.
 *
 * Only facts verified by RBE Capital Equip. are stored here. Anything not yet
 * supplied (parent website, form endpoint) is left empty and is simply not
 * rendered or put in schema.
 */
export const site = {
  url: SITE_URL,
  name: 'RBE Capital Equip.',
  legalName: 'RBE Capital Equip.',
  parent: {
    name: 'Rotoblast Engineering',
    // Not yet supplied: official Rotoblast Engineering website (empty = omitted from schema).
    url: '',
  },
  tagline: 'Backhoe loader rental for construction and infrastructure projects across Kumaon',

  // Primary number: shown everywhere, dialled by every Call button, and used for WhatsApp.
  phoneDisplay: '+91 78277 28607',
  phoneE164: '+917827728607',
  whatsappE164: '917827728607', // digits only, no "+", for wa.me links
  // Second call line, listed on the Contact page and in the footer.
  phone2Display: '+91 98110 30794',
  phone2E164: '+919811030794',
  email: 'sales@rbecapitalgroup.in', // sales enquiries
  contactEmail: 'rehman@rbecapitalgroup.in',
  // Not yet supplied: optional form endpoint. Empty = WhatsApp + email handoff only.
  formEndpoint: '',
  // Head office. No PIN code supplied, so none is published.
  address: {
    street: 'Plot No 71A, Sector 27C',
    locality: 'Faridabad',
    region: 'Haryana',
    country: 'IN',
    display: 'Plot No 71A, Sector 27C, Faridabad, Haryana, India',
  },
  // Where the machines are based — not the head office.
  machineBase: {
    locality: 'Haldwani',
    region: 'Uttarakhand',
    country: 'IN',
    display: 'Haldwani, Uttarakhand',
  },
  hours: '8:00 AM – 8:00 PM',
  machine: 'JCB backhoe loaders — a range of models, not one fixed model',
  projects: ['Ranikhet–Majkhali resort development project', 'Padampuri Road Widening project'],
} as const;

export const tel = `tel:${site.phoneE164}`;
export const tel2 = `tel:${site.phone2E164}`;
export const mailto = `mailto:${site.email}`;
export const mailtoContact = `mailto:${site.contactEmail}`;
export function wa(text = 'Hello RBE Capital Equip., I want to check backhoe loader availability for a project.') {
  return `https://wa.me/${site.whatsappE164}?text=${encodeURIComponent(text)}`;
}

export const nav = [
  { href: '/backhoe-loader-rental/', label: 'Backhoe Loader' },
  { href: '/project-solutions/', label: 'Project Solutions' },
  { href: '/kumaon-service-area/', label: 'Kumaon Service Area' },
  { href: '/how-rental-works/', label: 'How It Works' },
  { href: '/why-rbe/', label: 'Why RBE' },
  { href: '/knowledge/', label: 'Knowledge' },
] as const;
