import { SITE_URL } from './site-url.mjs';

/**
 * Single source of truth for business facts.
 *
 * Only details supplied and confirmed by RBE Capital Equip. belong here.
 * There is no separately confirmed phone line: the verified immediate
 * contact is WhatsApp, so the site offers WhatsApp and email, never a
 * "Call" number. Do not add a street, PIN code or office for Haldwani —
 * Haldwani is the machine deployment base, not an office address.
 */
export const site = {
  url: SITE_URL,
  name: 'RBE Capital Equip.',
  parent: {
    name: 'Rotoblast Engineering',
    // Official Rotoblast Engineering website, if one is confirmed ('' = omitted from schema).
    url: '',
  },
  tagline: 'Backhoe loader rental for construction and infrastructure projects across Kumaon',

  whatsappDisplay: '+91 78277 28607',
  whatsappDigits: '917827728607', // for wa.me links: country code + number, no "+" or spaces
  email: 'arehman@rotoblasteng.com', // direct contact
  salesEmail: 'sales@rotoblasteng.com', // rental enquiries and quotes

  deploymentBase: { locality: 'Haldwani', region: 'Uttarakhand', country: 'IN' },
  headOffice: { area: 'Sector 27C', locality: 'Faridabad', region: 'Haryana', country: 'IN' },

  // Optional form endpoint (e.g. a CRM webhook). Empty = the form hands the enquiry to WhatsApp / email.
  formEndpoint: '',
} as const;

export const headOfficeText = `${site.headOffice.area}, ${site.headOffice.locality}, ${site.headOffice.region}, India`;
export const deploymentText = `${site.deploymentBase.locality}, ${site.deploymentBase.region}`;

export const waBase = `https://wa.me/${site.whatsappDigits}`;
export const mailto = `mailto:${site.salesEmail}`;
export const mailtoDirect = `mailto:${site.email}`;

export const defaultWaText =
  'Hello RBE Capital Equip., I would like to check backhoe loader availability for a project in Kumaon.\nSite location:\nType of work:\nStart date / duration:';

export function wa(text: string = defaultWaText) {
  return `${waBase}?text=${encodeURIComponent(text)}`;
}

export function mailtoWith(subject: string, body = '') {
  return `${mailto}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
}

export const nav = [
  { href: '/backhoe-loader-rental/', label: 'Backhoe Loader' },
  { href: '/project-solutions/', label: 'Project Solutions' },
  { href: '/kumaon-service-area/', label: 'Kumaon Service Area' },
  { href: '/how-rental-works/', label: 'How It Works' },
  { href: '/why-rbe/', label: 'Why RBE' },
  { href: '/knowledge/', label: 'Knowledge' },
] as const;
