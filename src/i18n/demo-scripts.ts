// Scripted conversations for the transcript demos. They are illustrative and stay the same
// whichever page language the visitor is on. `rules` are the prompt rules applied with that message.
// Home shows three business scenarios; the case study shows its own intake conversation.

export interface DemoMessage {
  from: 'user' | 'agent';
  text: string;
  voice?: boolean;
  rules?: number[];
}

export interface DemoScript {
  tab: string;
  lang: 'ar' | 'en' | 'fr';
  dir: 'ltr' | 'rtl';
  voiceLabel: string;
  messages: DemoMessage[];
  route: string;
}

export type ScriptSet = Record<string, DemoScript>;

export const homeScripts: ScriptSet = {
  clinic: {
    tab: 'Clinic · AR',
    lang: 'ar',
    dir: 'rtl',
    voiceLabel: 'رسالة صوتية · تم تحويلها لنص',
    messages: [
      { from: 'user', voice: true, text: 'مرحبا، بدي احجز موعد عند دكتور أسنان، ضرسي عم يوجعني' },
      { from: 'agent', rules: [0, 2], text: 'سلامتك! أي يوم يناسبك أكثر هذا الأسبوع؟' },
      { from: 'user', text: 'بكرا العصر إذا في' },
      { from: 'agent', rules: [1, 2], text: 'متاح غداً الساعة 4:30 مع د. سارة. هل أثبّت الموعد باسم الرقم الذي تراسلنا منه؟' },
      { from: 'user', text: 'إي ثبّتو' },
      { from: 'agent', rules: [3], text: 'تم. سيصلك تأكيد الآن وتذكير قبل الموعد بساعتين.' },
    ],
    route: 'تم الحجز ← د. سارة · غداً 4:30 · تأكيد وتذكير مجدولان',
  },
  estate: {
    tab: 'Real estate · EN',
    lang: 'en',
    dir: 'ltr',
    voiceLabel: 'Voice note · transcribed',
    messages: [
      { from: 'user', text: 'Hi, is the 2-bed in Marina still available?' },
      { from: 'agent', rules: [0, 2], text: 'It is. Are you looking to buy or to rent?' },
      { from: 'user', text: 'Buy. Budget around 1.8M' },
      { from: 'agent', rules: [1, 2], text: 'That fits. Would you like to see it this week? I have Thursday 6 pm or Saturday morning.' },
      { from: 'user', text: 'Saturday works' },
      { from: 'agent', rules: [3], text: 'Booked for Saturday 10 am. Karim from our team will meet you there and send the details now.' },
    ],
    route: 'Qualified → hot lead · viewing Sat 10:00 · sent to sales',
  },
  store: {
    tab: 'Store · FR',
    lang: 'fr',
    dir: 'ltr',
    voiceLabel: 'Message vocal · transcrit',
    messages: [
      { from: 'user', voice: true, text: 'Bonjour, ma commande devait arriver hier et je n’ai rien reçu' },
      { from: 'agent', rules: [0, 2], text: 'Désolé pour ce retard. Pouvez-vous me donner votre numéro de commande ?' },
      { from: 'user', text: 'C’est 48213' },
      { from: 'agent', rules: [1, 2], text: 'Merci. Le colis est au dépôt et sera livré demain avant midi. Voulez-vous un remboursement des frais de port ?' },
      { from: 'user', text: 'Oui, merci' },
      { from: 'agent', rules: [3], text: 'C’est fait. Vous recevrez un e-mail de confirmation dans quelques minutes.' },
    ],
    route: 'Résolu → frais de port remboursés · suivi envoyé · ticket fermé',
  },
};

export const caseScripts: ScriptSet = {
  ar: {
    tab: 'AR',
    lang: 'ar',
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
    tab: 'EN',
    lang: 'en',
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
    tab: 'FR',
    lang: 'fr',
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

// Message slips that float at the bottom of the 3D scene.
export interface FlowMessage {
  lang: string;
  text: string;
  dir: 'ltr' | 'rtl';
  voice?: boolean;
}

export const flowMessages: FlowMessage[] = [
  { lang: 'AR', text: 'مرحبا، بدي احجز موعد', dir: 'rtl' },
  { lang: 'EN', text: 'Is the 2-bed still available?', dir: 'ltr' },
  { lang: 'FR', text: 'Où est ma commande ?', dir: 'ltr' },
  { lang: 'TR', text: 'Fiyat teklifi alabilir miyim?', dir: 'ltr' },
  { lang: 'AR', text: '', dir: 'rtl', voice: true },
  { lang: 'ES', text: '¿Tienen cita el martes?', dir: 'ltr' },
];
