// Scripted conversations for the "How the agent thinks" demo. They are illustrative,
// and stay the same whichever page language the visitor is on.
// `rules` are the indexes of the prompt rules the agent applies with that message.

export type DemoLang = 'ar' | 'en' | 'fr';

export interface DemoMessage {
  from: 'user' | 'agent';
  text: string;
  voice?: boolean;
  rules?: number[];
}

export interface DemoScript {
  label: string;
  dir: 'ltr' | 'rtl';
  voiceLabel: string;
  messages: DemoMessage[];
  route: string;
}

export const demoScripts: Record<DemoLang, DemoScript> = {
  ar: {
    label: 'العربية',
    dir: 'rtl',
    voiceLabel: 'رسالة صوتية · تم تحويلها لنص',
    messages: [
      { from: 'user', voice: true, text: 'مرحبا، أنا لسا واصل عكندا وبدي ساعدة لاقي بيت' },
      { from: 'agent', rules: [0, 2], text: 'أهلاً وسهلاً! أكيد سأساعدك. هل تبحث عن سكن مؤقت أم سكن دائم؟' },
      { from: 'user', text: 'دايم، أنا ومرتي وولدين' },
      { from: 'agent', rules: [1, 2], text: 'شكراً لك. في أي مدينة أنت الآن؟' },
      { from: 'user', text: 'تورونتو' },
      { from: 'agent', rules: [3], text: 'تمام. حوّلت طلبك إلى برنامج السكن، وسيتواصل معك أحد المنسقين قريباً.' },
    ],
    route: 'تم التوجيه ← برنامج السكن · تم إشعار المسؤول · الملخص مرفق',
  },
  en: {
    label: 'English',
    dir: 'ltr',
    voiceLabel: 'Voice note · transcribed',
    messages: [
      { from: 'user', voice: true, text: 'Hi, I just arrived in Canada and I need help finding a place to live' },
      { from: 'agent', rules: [0, 2], text: 'Welcome! I can help with that. Are you looking for temporary shelter or long-term housing?' },
      { from: 'user', text: 'Long term. Me, my wife and our two kids' },
      { from: 'agent', rules: [1, 2], text: 'Thank you. Which city are you in right now?' },
      { from: 'user', text: 'Toronto' },
      { from: 'agent', rules: [3], text: 'Got it. I’ve sent your request to our Housing program, and a coordinator will contact you soon.' },
    ],
    route: 'Routed → Housing program · owner notified · summary attached',
  },
  fr: {
    label: 'Français',
    dir: 'ltr',
    voiceLabel: 'Message vocal · transcrit',
    messages: [
      { from: 'user', voice: true, text: 'Bonjour, je viens d’arriver au Canada et j’ai besoin d’aide pour trouver un logement' },
      { from: 'agent', rules: [0, 2], text: 'Bienvenue ! Je peux vous aider. Cherchez-vous un hébergement temporaire ou un logement à long terme ?' },
      { from: 'user', text: 'Long terme. Moi, ma femme et nos deux enfants' },
      { from: 'agent', rules: [1, 2], text: 'Merci. Dans quelle ville êtes-vous en ce moment ?' },
      { from: 'user', text: 'Toronto' },
      { from: 'agent', rules: [3], text: 'Parfait. J’ai transmis votre demande au programme Logement. Un coordinateur vous contactera bientôt.' },
    ],
    route: 'Transmis → Programme Logement · responsable notifié · résumé joint',
  },
};

// Messages that flow through the hero simulation. `tile` points at one of the labelled program tiles.
export interface FlowMessage {
  lang: string;
  text: string;
  dir: 'ltr' | 'rtl';
  tile: number;
  voice?: boolean;
}

export const flowMessages: FlowMessage[] = [
  { lang: 'AR', text: 'مرحبا، بدي مساعدة بالسكن', dir: 'rtl', tile: 0 },
  { lang: 'FR', text: 'Bonjour, cours de français ?', dir: 'ltr', tile: 1 },
  { lang: 'EN', text: 'Hi, I need legal help', dir: 'ltr', tile: 2 },
  { lang: 'TR', text: 'Merhaba, iş arıyorum', dir: 'ltr', tile: 3 },
  { lang: 'AR', text: '', dir: 'rtl', tile: 4, voice: true },
  { lang: 'ES', text: 'Hola, ¿clases para niños?', dir: 'ltr', tile: 5 },
];
