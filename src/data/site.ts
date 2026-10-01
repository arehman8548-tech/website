import { SITE_URL } from './site-url.mjs';

/**
 * Single source of truth for business facts.
 *
 * Every value marked CONFIRM must be supplied/verified by RBE Capital Equip.
 * before launch. Nothing here is invented: where a fact was not provided
 * (phone, address, fleet size, years) it is either a placeholder that the
 * site renders neutrally, or it is simply not shown.
 */
export const site = {
  url: SITE_URL,
  name: 'RBE Capital Equip.',
  legalName: 'RBE Capital Equip.',
  parent: {
    name: 'Rotoblast Engineering',
    // CONFIRM: official Rotoblast Engineering website (leave '' to omit from schema).
    url: '',
  },
  tagline: 'Backhoe loader rental for construction and infrastructure projects across Kumaon',

  // CONFIRM: all contact details below.
  phoneDisplay: '+91 00000 00000',
  phoneE164: '+910000000000',
  whatsappE164: '910000000000', // digits only, no "+", for wa.me links
  email: 'enquiry@rbecapitalequip.com',
  // CONFIRM: optional form endpoint (e.g. Formspree / your CRM webhook). Empty = WhatsApp + email handoff only.
  formEndpoint: '',
  // CONFIRM: office / yard address. Left empty, it is not rendered or put in schema.
  address: {
    street: '',
    locality: '',
    region: 'Uttarakhand',
    postalCode: '',
    country: 'IN',
  },
  // CONFIRM: enquiry hours as you actually staff them.
  hours: 'Mon–Sat, 8:00 am – 8:00 pm',
} as const;

export const tel = `tel:${site.phoneE164}`;
export const mailto = `mailto:${site.email}`;
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
