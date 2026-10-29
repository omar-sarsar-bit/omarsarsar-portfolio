// Structured data (JSON-LD) so search engines understand who Omar is and what he offers.
import { site } from '../config/site';
import { t, localePath, type Lang } from '../i18n';

export function personSchema(lang: Lang) {
  const d = t(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: lang === 'ar' ? site.nameAr : site.name,
    alternateName: lang === 'ar' ? site.name : site.nameAr,
    jobTitle: d.meta.role,
    email: `mailto:${site.email}`,
    url: new URL(localePath(lang, '/'), site.url).href,
    image: new URL('/apple-touch-icon.png', site.url).href,
    knowsLanguage: ['ar', 'en'],
    knowsAbout: ['AI automation', 'n8n', 'AI agents', 'Chatbots', 'Web applications', 'SaaS', 'Motion design', 'Lottie'],
    sameAs: [site.iconscout, site.linkedin].filter(Boolean),
  };
}

export function serviceSchema(lang: Lang) {
  const d = t(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `${lang === 'ar' ? site.nameAr : site.name} · ${d.meta.role}`,
    url: new URL(localePath(lang, '/'), site.url).href,
    email: site.email,
    telephone: site.whatsapp,
    founder: { '@id': `${site.url}/#person` },
    areaServed: ['GCC', 'Canada', 'Europe'],
    availableLanguage: ['Arabic', 'English'],
    description: d.meta.description,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: d.meta.role,
      itemListElement: [d.understand, d.route, d.report, d.interface].map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.service, description: s.body },
      })),
    },
  };
}

export function faqSchema(lang: Lang) {
  const d = t(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: d.output.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function caseStudySchema(lang: Lang) {
  const d = t(lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${d.caseStudy.heading.join(' ')} ${d.caseStudy.sub}`,
    description: d.caseStudy.description,
    inLanguage: lang,
    author: { '@id': `${site.url}/#person` },
    image: new URL(`/og/${lang}.png`, site.url).href,
    mainEntityOfPage: new URL(localePath(lang, '/work/multilingual-ai-intake/'), site.url).href,
  };
}
