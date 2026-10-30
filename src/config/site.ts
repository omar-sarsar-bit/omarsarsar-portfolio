// Contact details and links used across the site. Edit this file to update them everywhere.
export const site = {
  name: 'Omar Sarsar',
  nameAr: 'عمر صرصر',
  url: 'https://omarsarsar.vercel.app',
  email: 'omarsarsar.orpetron@gmail.com',
  // International format, digits only after the plus sign.
  whatsapp: '+963985632774',
  // Paste your full LinkedIn profile URL here; the LinkedIn button stays hidden while it is empty.
  linkedin: 'https://www.linkedin.com/in/omarsarsar/',
  iconscout: 'https://iconscout.com/contributors/osamasarsar',
  orpetron: 'https://orpetron.agency',
};

export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

export function emailLink(subject: string): string {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
}
