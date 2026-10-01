import { site, waBase } from './site';
import { places, districts } from './geo';

const ORG_ID = `${site.url}/#org`;
const SITE_ID = `${site.url}/#website`;

/**
 * Organization entity — referenced by @id from every other node.
 *
 * Deliberately NOT LocalBusiness: there is no verified walk-in premises.
 * Haldwani is where machines are deployed from (stated in the description
 * and areaServed), not an office, so it is not given a PostalAddress. The
 * head office address is limited to what was supplied (no street/PIN).
 * No telephone property: the only verified number is a WhatsApp contact.
 */
export function organization() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: site.name,
    alternateName: 'RBE',
    url: `${site.url}/`,
    logo: { '@type': 'ImageObject', url: `${site.url}/brand/rbe-mark.png` },
    description:
      'RBE Capital Equip. rents backhoe loaders for construction and infrastructure projects across the Kumaon region of Uttarakhand, India. Machines are deployed from Haldwani, Uttarakhand; the head office is in Sector 27C, Faridabad, Haryana. It is an enterprise of Rotoblast Engineering.',
    email: site.salesEmail,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.headOffice.area,
      addressLocality: site.headOffice.locality,
      addressRegion: site.headOffice.region,
      addressCountry: site.headOffice.country,
    },
    parentOrganization: { '@type': 'Organization', name: site.parent.name, ...(site.parent.url ? { url: site.parent.url } : {}) },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Kumaon division, Uttarakhand, India' },
      ...places.map((p) => ({ '@type': 'Place', name: `${p.name}, ${p.district} district, Uttarakhand` })),
    ],
    knowsAbout: [
      'Backhoe loader rental',
      'Construction equipment deployment in hill terrain',
      'Road construction and widening',
      'Hill cutting and slope works',
      'Site development and earthworks',
    ],
    contactPoint: [
      { '@type': 'ContactPoint', contactType: 'sales', email: site.salesEmail, url: waBase, areaServed: 'IN', availableLanguage: ['English', 'Hindi'] },
      { '@type': 'ContactPoint', contactType: 'customer support', email: site.email, areaServed: 'IN', availableLanguage: ['English', 'Hindi'] },
    ],
  };
}

export function website() {
  return { '@type': 'WebSite', '@id': SITE_ID, url: `${site.url}/`, name: site.name, publisher: { '@id': ORG_ID }, inLanguage: 'en-IN' };
}

export function webpage(path: string, name: string, description: string, type = 'WebPage') {
  return { '@type': type, '@id': `${site.url}${path}#page`, url: `${site.url}${path}`, name, description, isPartOf: { '@id': SITE_ID }, about: { '@id': ORG_ID }, inLanguage: 'en-IN' };
}

export function breadcrumbs(items: { name: string; href: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', href: '/' }, ...items].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${site.url}${it.href}` })),
  };
}

export function rentalService() {
  return {
    '@type': 'Service',
    '@id': `${site.url}/backhoe-loader-rental/#service`,
    name: 'Backhoe loader rental',
    serviceType: 'Construction equipment rental — backhoe loader',
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'AdministrativeArea', name: 'Kumaon division, Uttarakhand, India', containsPlace: districts.map((d) => ({ '@type': 'AdministrativeArea', name: `${d} district` })) },
    audience: { '@type': 'BusinessAudience', audienceType: 'Contractors, real-estate developers, infrastructure and EPC companies, project and procurement teams' },
    description:
      'Backhoe loaders rented for road construction and widening, hill cutting, site development, trenching and infrastructure works in Kumaon, deployed from Haldwani, for durations from a few weeks to a full project phase. Terms, including the operator arrangement, are confirmed in each quote.',
  };
}

/** Adds the Q&A to the page's own WebPage node (same @id), so the page is one FAQPage entity. */
export function faqPage(path: string, qas: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${site.url}${path}#page`,
    mainEntity: qas.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
  };
}

export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
