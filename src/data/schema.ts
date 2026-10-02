import { site } from './site';
import { places, districts } from './geo';

const ORG_ID = `${site.url}/#org`;
const SITE_ID = `${site.url}/#website`;

const hasAddress = Boolean(site.address.street && site.address.locality);

/** Organization entity — referenced by @id from every other node. */
export function organization() {
  const org: Record<string, unknown> = {
    '@type': hasAddress ? ['Organization', 'LocalBusiness'] : 'Organization',
    '@id': ORG_ID,
    name: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/brand/rbe-mark.png`,
    description:
      'RBE Capital Equip. rents backhoe loaders for construction and infrastructure projects across the Kumaon region of Uttarakhand, India. It is an enterprise of Rotoblast Engineering.',
    telephone: site.phoneE164,
    email: site.email,
    parentOrganization: { '@type': 'Organization', name: site.parent.name, ...(site.parent.url ? { url: site.parent.url } : {}) },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Kumaon division, Uttarakhand, India' },
      ...places.map((p) => ({ '@type': 'City', name: `${p.name}, Uttarakhand` })),
    ],
    knowsAbout: [
      'Backhoe loader rental',
      'Road construction equipment',
      'Hill road excavation',
      'Site development and earthworks',
      'Construction equipment for hilly terrain',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: site.phoneE164,
      email: site.email,
      contactType: 'sales',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi'],
    },
    // Machine base (Haldwani) is where equipment is kept — distinct from the head-office address below.
    location: {
      '@type': 'Place',
      name: `${site.name} machine base`,
      address: { '@type': 'PostalAddress', addressLocality: site.machineBase.locality, addressRegion: site.machineBase.region, addressCountry: site.machineBase.country },
    },
  };
  if (hasAddress) {
    org.address = {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    };
  }
  return org;
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
    serviceType: 'Construction equipment rental — backhoe loader with operator',
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'AdministrativeArea', name: 'Kumaon division, Uttarakhand, India', containsPlace: districts.map((d) => ({ '@type': 'AdministrativeArea', name: `${d} district` })) },
    audience: { '@type': 'BusinessAudience', audienceType: 'Contractors, real-estate developers, infrastructure and EPC companies' },
    description:
      'Backhoe loaders rented for road construction and widening, hill cutting, site development, trenching and infrastructure works in Kumaon, for durations from short assignments to full project periods.',
  };
}

export function faqPage(qas: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: qas.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
  };
}

export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
