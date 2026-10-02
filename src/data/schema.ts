import { site } from './site';
import { places, districts } from './geo';

const ORG_ID = `${site.url}/#org`;
const SITE_ID = `${site.url}/#website`;

/** Organization entity — referenced by @id from every other node. */
export function organization() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/brand/rbe-mark.png`,
    description:
      'RBE Capital Equip. rents JCB backhoe loaders (range of models, depending on project requirement and availability), always with an operator and for a minimum of 15 days, to construction and infrastructure projects across the Kumaon region of Uttarakhand, India. The machine is dispatched from Haldwani and from Majkhali near Ranikhet. Head office: Sector 27C, Faridabad, Haryana. It is an enterprise of Rotoblast Engineering.',
    telephone: site.phoneE164,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.headOffice.street,
      addressLocality: site.headOffice.locality,
      addressRegion: site.headOffice.region,
      addressCountry: site.headOffice.country,
    },
    location: site.bases.map((b) => ({
      '@type': 'Place',
      name: `RBE Capital Equip. deployment base — ${b.name}`,
      address: { '@type': 'PostalAddress', addressLocality: b.name, addressRegion: 'Uttarakhand', addressCountry: 'IN' },
    })),
    parentOrganization: { '@type': 'Organization', name: site.parent.name, ...(site.parent.url ? { url: site.parent.url } : {}) },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Kumaon division, Uttarakhand, India' },
      ...places.map((p) => ({ '@type': 'Place', name: `${p.name}, ${p.district} district, Uttarakhand` })),
    ],
    knowsAbout: [
      'Backhoe loader rental with operator',
      'Road construction and widening equipment',
      'Hill cutting and slope excavation',
      'Site development and earthworks',
      'Construction equipment mobilisation in hilly terrain',
    ],
    contactPoint: [
      { '@type': 'ContactPoint', telephone: site.phoneE164, email: site.email, contactType: 'sales', areaServed: 'IN', availableLanguage: ['English', 'Hindi'], hoursAvailable: { '@type': 'OpeningHoursSpecification', opens: '08:00', closes: '20:00' } },
      { '@type': 'ContactPoint', telephone: `+${site.whatsappE164}`, contactType: 'sales', description: 'WhatsApp', areaServed: 'IN', availableLanguage: ['English', 'Hindi'], hoursAvailable: { '@type': 'OpeningHoursSpecification', opens: '08:00', closes: '20:00' } },
      { '@type': 'ContactPoint', email: site.contactEmail, contactType: 'customer service' },
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
    serviceType: 'Construction equipment rental — backhoe loader with operator',
    category: 'Backhoe loader (JCB) rental',
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'AdministrativeArea', name: 'Kumaon division, Uttarakhand, India', containsPlace: districts.map((d) => ({ '@type': 'AdministrativeArea', name: `${d} district` })) },
    audience: { '@type': 'BusinessAudience', audienceType: 'Contractors, real-estate developers, infrastructure and EPC companies' },
    description:
      'Backhoe loader rental for road construction and widening, hill cutting, site development, trenching and infrastructure works in Kumaon. Always supplied with an operator; minimum rental 15 days, monthly or for the project duration; hydraulic rock breaker available; GST invoice on request. Dispatched from Haldwani and Majkhali (Ranikhet).',
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
