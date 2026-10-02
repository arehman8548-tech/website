import { SITE_URL } from './site-url.mjs';

/**
 * Single source of truth for business facts.
 *
 * Everything here was confirmed by RBE Capital Equip. Nothing is inferred.
 * Not yet supplied (and therefore NOT shown anywhere on the site): fleet size,
 * machine make/model, years in operation, clients, project history,
 * testimonials, certifications, enquiry hours, response times, pricing, GSTIN.
 */
export const site = {
  url: SITE_URL,
  name: 'RBE Capital Equip.',
  legalName: 'RBE Capital Equip.',
  parent: {
    name: 'Rotoblast Engineering',
    // Official Rotoblast Engineering website, if any (leave '' to omit from schema).
    url: '',
  },
  tagline: 'Backhoe loader rental with operator for construction and infrastructure projects across Kumaon',

  // Calls
  phoneDisplay: '+91 98110 30794',
  phoneE164: '+919811030794',
  // WhatsApp (a different number from the calling line)
  whatsappDisplay: '+91 78277 28607',
  whatsappE164: '917827728607', // digits only, no "+", for wa.me links
  // Enquiries go to sales; general correspondence to the contact address.
  email: 'sales@rbecapitalgroup.in',
  contactEmail: 'rehman@rbecapitalgroup.in',
  // Optional form endpoint (Formspree / CRM webhook). Empty = WhatsApp + email handoff.
  formEndpoint: '',

  headOffice: {
    display: 'Sector 27C, Faridabad, Haryana, India',
    street: 'Sector 27C',
    locality: 'Faridabad',
    region: 'Haryana',
    country: 'IN',
  },
  // Where the machine is dispatched to client sites from.
  bases: [
    { name: 'Haldwani', area: 'Nainital district', note: 'Plains gateway to the Kumaon hills' },
    { name: 'Majkhali', area: 'near Ranikhet, Almora district', note: 'On the Ranikhet–Almora road, inside the hills' },
  ],

  // Rental terms confirmed by the business.
  terms: {
    minimum: '15 days',
    operator: 'Every rental is supplied with an operator',
    gst: 'GST invoice available on request',
    breaker: 'Hydraulic rock breaker available',
  },
} as const;

export const basesText = 'Haldwani and Majkhali (Ranikhet)';
export const tel = `tel:${site.phoneE164}`;
export const mailto = `mailto:${site.email}`;
export const mailtoContact = `mailto:${site.contactEmail}`;
export function wa(text = 'Hello RBE Capital Equip., I want to check backhoe loader availability for a project in Kumaon.') {
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
