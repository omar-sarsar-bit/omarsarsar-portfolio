// Scripted conversations for the transcript demos. They are illustrative, run on sample data,
// and `rules` lists the prompt rules applied with that message.
// - homeScripts: the front-desk chapter, three scenarios in three languages.
// - caseScripts: the case study intake, one conversation in three languages.
// - workDemos: the live demos opened from the work index, in the page language, each with a result.

export interface DemoMessage {
  from: 'user' | 'agent';
  text: string;
  voice?: boolean;
  rules?: number[];
}

export interface DemoScript {
  code: string;
  lang: 'ar' | 'en' | 'fr';
  dir: 'ltr' | 'rtl';
  voiceLabel: string;
  messages: DemoMessage[];
  route: string;
}

export type ScriptSet = Record<string, DemoScript>;

export interface WorkDemo {
  lang: 'ar' | 'en';
  dir: 'ltr' | 'rtl';
  voiceLabel: string;
  points: string[];
  messages: DemoMessage[];
  outcome: { title: string; rows: [string, string][] };
}

export const homeScripts: ScriptSet = {
  clinic: {
    code: 'AR',
    lang: 'ar',
    dir: 'rtl',
    voiceLabel: 'رسالة صوتية · حُوّلت إلى نص',
    messages: [
      { from: 'user', voice: true, text: 'مرحبا، بدي احجز موعد عند دكتور أسنان، ضرسي عم يوجعني' },
      { from: 'agent', rules: [0, 2], text: 'سلامتك! أي يوم يناسبك أكثر هذا الأسبوع؟' },
      { from: 'user', text: 'بكرا العصر إذا في' },
      { from: 'agent', rules: [1, 2], text: 'متاح غداً الساعة 4:30 مع د. سارة. هل أثبّت الموعد على الرقم الذي تراسلنا منه؟' },
      { from: 'user', text: 'إي ثبّتو' },
      { from: 'agent', rules: [3], text: 'تم. سيصلك تأكيد الآن، وتذكير قبل الموعد بساعتين.' },
    ],
    route: 'تم الحجز ← د. سارة · غداً 4:30 · التأكيد والتذكير مجدولان',
  },
  estate: {
    code: 'EN',
    lang: 'en',
    dir: 'ltr',
    voiceLabel: 'Voice note · transcribed',
    messages: [
      { from: 'user', text: 'Hi, is the 2-bed in Marina still available?' },
      { from: 'agent', rules: [0, 2], text: 'It is. Are you looking to buy or to rent?' },
      { from: 'user', text: 'Buy. Budget around 1.8M' },
      { from: 'agent', rules: [1, 2], text: 'That fits. Would you like to see it this week? I have Thursday 6 pm or Saturday morning.' },
      { from: 'user', text: 'Saturday works' },
      { from: 'agent', rules: [3], text: 'Booked for Saturday 10 am. Karim from our team will meet you there and send the location now.' },
    ],
    route: 'Qualified → hot lead · viewing Sat 10:00 · sent to sales',
  },
  store: {
    code: 'FR',
    lang: 'fr',
    dir: 'ltr',
    voiceLabel: 'Message vocal · transcrit',
    messages: [
      { from: 'user', voice: true, text: 'Bonjour, ma commande devait arriver hier et je n’ai rien reçu' },
      { from: 'agent', rules: [0, 2], text: 'Désolé pour ce retard. Pouvez-vous me donner votre numéro de commande ?' },
      { from: 'user', text: 'C’est 48213' },
      { from: 'agent', rules: [1, 2], text: 'Merci. Le colis est au dépôt et sera livré demain avant midi. Voulez-vous le remboursement des frais de port ?' },
      { from: 'user', text: 'Oui, merci' },
      { from: 'agent', rules: [3], text: 'C’est fait. Vous recevrez un e-mail de confirmation dans quelques minutes.' },
    ],
    route: 'Résolu → frais de port remboursés · suivi envoyé · ticket fermé',
  },
};

export const caseScripts: ScriptSet = {
  ar: {
    code: 'AR',
    lang: 'ar',
    dir: 'rtl',
    voiceLabel: 'رسالة صوتية · حُوّلت إلى نص',
    messages: [
      { from: 'user', voice: true, text: 'مرحبا، أنا لسا واصل عكندا وبدي ساعدة لاقي بيت' },
      { from: 'agent', rules: [0, 2], text: 'أهلاً وسهلاً! أكيد سأساعدك. هل تبحث عن سكن مؤقت أم سكن دائم؟' },
      { from: 'user', text: 'دايم، أنا ومرتي وولدين' },
      { from: 'agent', rules: [1, 2], text: 'شكراً لك. في أي مدينة أنت الآن؟' },
      { from: 'user', text: 'تورونتو' },
      { from: 'agent', rules: [3], text: 'تمام. حوّلت طلبك إلى برنامج السكن، وسيتواصل معك أحد المنسقين قريباً.' },
    ],
    route: 'تم التوجيه ← برنامج السكن · أُشعر المسؤول · الملخص مرفق',
  },
  en: {
    code: 'EN',
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
    code: 'FR',
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

const VOICE_EN = 'Voice note · transcribed';
const VOICE_AR = 'رسالة صوتية · حُوّلت إلى نص';

export const workDemos: Record<'en' | 'ar', Record<string, WorkDemo>> = {
  en: {
    clinic: {
      lang: 'en',
      dir: 'ltr',
      voiceLabel: VOICE_EN,
      points: ['Answers WhatsApp and voice notes around the clock', 'Books, moves and cancels appointments in the clinic calendar', 'Sends confirmations and reminders, so fewer patients miss a visit'],
      messages: [
        { from: 'user', voice: true, text: 'Hi, I need a dentist. My tooth has been hurting since yesterday' },
        { from: 'agent', rules: [0, 2], text: 'Sorry to hear that. Would tomorrow work for you, morning or afternoon?' },
        { from: 'user', text: 'Afternoon please' },
        { from: 'agent', rules: [1, 2], text: 'Dr. Sara is free at 4:30 pm. Shall I book it under this number?' },
        { from: 'user', text: 'Yes please' },
        { from: 'agent', rules: [3], text: 'Done. You’ll get a confirmation now and a reminder two hours before your visit.' },
      ],
      outcome: { title: 'Appointment booked', rows: [['Patient', 'WhatsApp · ending 4417'], ['Doctor', 'Dr. Sara · Dental'], ['When', 'Tomorrow · 16:30'], ['Reminder', 'Scheduled for 14:30'], ['Calendar', 'Updated']] },
    },
    estate: {
      lang: 'en',
      dir: 'ltr',
      voiceLabel: VOICE_EN,
      points: ['Replies to every property inquiry in seconds', 'Scores each lead on budget, intent and timing', 'Books viewings and hands hot leads to the right agent'],
      messages: [
        { from: 'user', text: 'Hi, is the 2-bed in Marina still available?' },
        { from: 'agent', rules: [0, 2], text: 'It is. Are you looking to buy or to rent?' },
        { from: 'user', text: 'Buy. Budget around 1.8M' },
        { from: 'agent', rules: [1, 2], text: 'That fits. Would you like to see it this week? I have Thursday 6 pm or Saturday morning.' },
        { from: 'user', text: 'Saturday works' },
        { from: 'agent', rules: [3], text: 'Booked for Saturday 10 am. Karim from our team will meet you there and send the location now.' },
      ],
      outcome: { title: 'Hot lead sent to sales', rows: [['Intent', 'Buy · 2-bed · Marina'], ['Budget', 'AED 1.8M'], ['Viewing', 'Saturday · 10:00'], ['Agent', 'Karim'], ['CRM', 'Lead created with full chat']] },
    },
    assistant: {
      lang: 'en',
      dir: 'ltr',
      voiceLabel: VOICE_EN,
      points: ['Sorts your inbox and drafts the replies', 'Keeps your calendar, reminders and follow-ups', 'Sends one clear brief every morning on WhatsApp'],
      messages: [
        { from: 'user', voice: true, text: 'Remind me to call the supplier tomorrow. And what does my morning look like?' },
        { from: 'agent', rules: [0], text: 'Reminder set for 12:30, after your meetings. Tomorrow morning: Rami at 10:00, agenda attached, then the team check-in at 11:30.' },
        { from: 'user', text: 'Any emails I need to answer?' },
        { from: 'agent', rules: [1, 2], text: 'Two. A client wants the updated quote, and the landlord is confirming Thursday. I drafted both replies. Send them?' },
        { from: 'user', text: 'Send the landlord one. I’ll check the quote' },
        { from: 'agent', rules: [3], text: 'Sent. The quote draft is waiting in your inbox, flagged for today.' },
      ],
      outcome: { title: 'Handled while you talked', rows: [['Reminder', 'Supplier call · 12:30'], ['Emails', '1 sent · 1 drafted'], ['Calendar', '2 meetings tomorrow'], ['Next brief', 'Tomorrow 07:30 · WhatsApp']] },
    },
    intake: {
      lang: 'en',
      dir: 'ltr',
      voiceLabel: VOICE_EN,
      points: ['Turns long forms into a short conversation', 'Collects and checks documents before anyone opens the file', 'Sends each complete application to the right person'],
      messages: [
        { from: 'user', text: 'Hi, I want to apply for the web development course' },
        { from: 'agent', rules: [0, 2], text: 'Great choice. What is your full name?' },
        { from: 'user', text: 'Lina Haddad' },
        { from: 'agent', rules: [1, 2], text: 'Thanks, Lina. Please send a photo of your ID and your latest certificate.' },
        { from: 'user', text: 'Sent 2 files: ID photo, certificate.pdf' },
        { from: 'agent', rules: [3], text: 'Both received and readable. Your application is complete and has gone to Admissions. You will hear back within 48 hours.' },
      ],
      outcome: { title: 'Application routed', rows: [['Applicant', 'Lina Haddad'], ['Program', 'Web development'], ['Documents', 'ID ✓ · certificate ✓'], ['Sent to', 'Admissions · Rana'], ['Status', 'Complete · reply within 48 h']] },
    },
    inventory: {
      lang: 'en',
      dir: 'ltr',
      voiceLabel: VOICE_EN,
      points: ['Answers stock questions from your live inventory', 'Drafts purchase orders before items run out', 'Matches supplier invoices to payments'],
      messages: [
        { from: 'user', text: 'How many paper cups do we have left?' },
        { from: 'agent', rules: [0], text: '120 cups. At this week’s pace that is about two days. The minimum you set is 300.' },
        { from: 'user', text: 'Order more' },
        { from: 'agent', rules: [1, 2], text: 'Same supplier as last time, 2,000 cups at 0.09 each?' },
        { from: 'user', text: 'Yes' },
        { from: 'agent', rules: [3], text: 'Purchase order PO-0142 is waiting for your approval. I will match the invoice to the payment when it arrives.' },
      ],
      outcome: { title: 'Purchase order drafted', rows: [['Item', 'Paper cups · 12 oz'], ['Quantity', '2,000'], ['Supplier', 'Same as last order'], ['Total', '180.00'], ['Status', 'Waiting for approval']] },
    },
    reports: {
      lang: 'en',
      dir: 'ltr',
      voiceLabel: VOICE_EN,
      points: ['Pulls numbers from every tool you use', 'Writes the summary in plain language', 'Delivers daily, weekly and monthly, where you already read'],
      messages: [
        { from: 'user', text: 'Send me this week’s summary' },
        { from: 'agent', rules: [0], text: '412 conversations, 37 bookings and 9 new leads. WhatsApp brought 71% of them.' },
        { from: 'user', text: 'Anything I should worry about?' },
        { from: 'agent', rules: [1, 2], text: 'Two things. Instagram replies were slower on Tuesday, and 4 leads have had no follow-up. Shall I assign them?' },
        { from: 'user', text: 'Give them to Maya' },
        { from: 'agent', rules: [3], text: 'Done. Maya has them, and the full PDF report is in your inbox.' },
      ],
      outcome: { title: 'Weekly report delivered', rows: [['Conversations', '412'], ['Bookings', '37'], ['New leads', '9'], ['Follow-ups', '4 assigned to Maya'], ['Delivered', 'Email · PDF · Monday 09:00']] },
    },
  },
  ar: {
    clinic: {
      lang: 'ar',
      dir: 'rtl',
      voiceLabel: VOICE_AR,
      points: ['يردّ على واتساب والرسائل الصوتية على مدار الساعة', 'يحجز المواعيد ويعدّلها ويلغيها في تقويم العيادة', 'يرسل التأكيد والتذكير، فيقل عدد المواعيد الفائتة'],
      messages: [
        { from: 'user', voice: true, text: 'مرحبا، بدي موعد عند دكتور أسنان، ضرسي عم يوجعني من مبارح' },
        { from: 'agent', rules: [0, 2], text: 'سلامتك! هل يناسبك غداً، صباحاً أم مساءً؟' },
        { from: 'user', text: 'العصر إذا ممكن' },
        { from: 'agent', rules: [1, 2], text: 'د. سارة متاحة غداً الساعة 4:30 عصراً. هل أثبّت الموعد على هذا الرقم؟' },
        { from: 'user', text: 'إي ثبّتو' },
        { from: 'agent', rules: [3], text: 'تم. سيصلك تأكيد الآن، وتذكير قبل الموعد بساعتين.' },
      ],
      outcome: { title: 'تم حجز الموعد', rows: [['المريض', 'واتساب · ينتهي بـ 4417'], ['الطبيب', 'د. سارة · أسنان'], ['الموعد', 'غداً · 16:30'], ['التذكير', 'مجدول الساعة 14:30'], ['التقويم', 'تم التحديث']] },
    },
    estate: {
      lang: 'ar',
      dir: 'rtl',
      voiceLabel: VOICE_AR,
      points: ['يردّ على كل استفسار عقاري خلال ثوانٍ', 'يقيّم كل عميل حسب الميزانية والنية والتوقيت', 'يحجز المعاينات ويسلّم العملاء الجادين للوكيل المناسب'],
      messages: [
        { from: 'user', text: 'السلام عليكم، الشقة غرفتين بالمارينا لسا متوفرة؟' },
        { from: 'agent', rules: [0, 2], text: 'وعليكم السلام، نعم متوفرة. هل تبحث عن شراء أم إيجار؟' },
        { from: 'user', text: 'شراء، ميزانيتي حوالي 1.8 مليون' },
        { from: 'agent', rules: [1, 2], text: 'مناسبة تماماً. هل تودّ معاينتها هذا الأسبوع؟ لدينا الخميس 6 مساءً أو السبت صباحاً.' },
        { from: 'user', text: 'السبت' },
        { from: 'agent', rules: [3], text: 'تم الحجز للسبت الساعة 10 صباحاً. سيلتقيك كريم من فريقنا هناك، وسأرسل لك الموقع الآن.' },
      ],
      outcome: { title: 'عميل جاد أُرسل للمبيعات', rows: [['النية', 'شراء · غرفتان · المارينا'], ['الميزانية', '1.8 مليون درهم'], ['المعاينة', 'السبت · 10:00'], ['الوكيل', 'كريم'], ['نظام العملاء', 'سُجّل العميل مع المحادثة كاملة']] },
    },
    assistant: {
      lang: 'ar',
      dir: 'rtl',
      voiceLabel: VOICE_AR,
      points: ['يفرز بريدك ويجهّز مسودات الردود', 'ينظّم تقويمك وتذكيراتك ومتابعاتك', 'يرسل لك ملخصاً واضحاً كل صباح على واتساب'],
      messages: [
        { from: 'user', voice: true, text: 'ذكّرني اتصل بالمورّد بكرا، وشو عندي الصبح؟' },
        { from: 'agent', rules: [0], text: 'ضبطت التذكير غداً الساعة 12:30 بعد اجتماعاتك. صباح الغد: رامي الساعة 10:00 وجدول الأعمال مرفق، ثم اجتماع الفريق 11:30.' },
        { from: 'user', text: 'في إيميلات لازم رد عليها؟' },
        { from: 'agent', rules: [1, 2], text: 'اثنان: عميل يطلب عرض السعر المحدّث، والمالك يؤكد موعد الخميس. جهّزت الردّين، هل أرسلهما؟' },
        { from: 'user', text: 'ابعت تبع المالك، وعرض السعر بشوفه أنا' },
        { from: 'agent', rules: [3], text: 'أُرسل. مسودة عرض السعر بانتظارك في بريدك، ومعلّمة لليوم.' },
      ],
      outcome: { title: 'أُنجز أثناء حديثك', rows: [['التذكير', 'الاتصال بالمورّد · 12:30'], ['البريد', 'رسالة أُرسلت · ومسودة جاهزة'], ['التقويم', 'اجتماعان غداً'], ['الملخص التالي', 'غداً 07:30 · واتساب']] },
    },
    intake: {
      lang: 'ar',
      dir: 'rtl',
      voiceLabel: VOICE_AR,
      points: ['يحوّل الاستمارات الطويلة إلى محادثة قصيرة', 'يجمع المستندات ويتحقق منها قبل أن يفتح أحد الملف', 'يرسل كل طلب مكتمل إلى الشخص المسؤول'],
      messages: [
        { from: 'user', text: 'مرحبا، بدي قدّم على دورة تطوير المواقع' },
        { from: 'agent', rules: [0, 2], text: 'اختيار ممتاز. ما اسمك الكامل؟' },
        { from: 'user', text: 'لينا حداد' },
        { from: 'agent', rules: [1, 2], text: 'شكراً يا لينا. أرسلي من فضلك صورة الهوية وآخر شهادة حصلتِ عليها.' },
        { from: 'user', text: 'أرسلت ملفين: صورة الهوية، الشهادة.pdf' },
        { from: 'agent', rules: [3], text: 'وصل الملفان وهما واضحان. اكتمل طلبك وأُرسل إلى قسم القبول، وسيصلك الرد خلال 48 ساعة.' },
      ],
      outcome: { title: 'وُجّه الطلب', rows: [['المتقدمة', 'لينا حداد'], ['البرنامج', 'تطوير المواقع'], ['المستندات', 'الهوية ✓ · الشهادة ✓'], ['أُرسل إلى', 'القبول · رنا'], ['الحالة', 'مكتمل · الرد خلال 48 ساعة']] },
    },
    inventory: {
      lang: 'ar',
      dir: 'rtl',
      voiceLabel: VOICE_AR,
      points: ['يجيب عن أسئلة المخزون من بياناتك المباشرة', 'يجهّز أوامر الشراء قبل نفاد الأصناف', 'يطابق فواتير الموردين مع المدفوعات'],
      messages: [
        { from: 'user', text: 'قديش باقي عنا أكواب ورق؟' },
        { from: 'agent', rules: [0], text: '120 كوباً. بمعدّل هذا الأسبوع تكفي يومين تقريباً، والحد الأدنى الذي حددته 300.' },
        { from: 'user', text: 'اطلب كمية جديدة' },
        { from: 'agent', rules: [1, 2], text: 'من المورّد نفسه في المرة الماضية، 2,000 كوب بسعر 0.09 للكوب؟' },
        { from: 'user', text: 'إي' },
        { from: 'agent', rules: [3], text: 'أمر الشراء PO-0142 بانتظار موافقتك. وسأطابق الفاتورة مع الدفعة عند وصولها.' },
      ],
      outcome: { title: 'جُهّز أمر الشراء', rows: [['الصنف', 'أكواب ورقية · 12 أونصة'], ['الكمية', '2,000'], ['المورّد', 'نفس الطلب السابق'], ['الإجمالي', '180.00'], ['الحالة', 'بانتظار الموافقة']] },
    },
    reports: {
      lang: 'ar',
      dir: 'rtl',
      voiceLabel: VOICE_AR,
      points: ['يسحب الأرقام من كل أداة تستخدمها', 'يكتب الملخص بلغة واضحة', 'يرسله يومياً وأسبوعياً وشهرياً، حيث تقرأ عادة'],
      messages: [
        { from: 'user', text: 'ابعتلي ملخص هالأسبوع' },
        { from: 'agent', rules: [0], text: '412 محادثة، و37 حجزاً، و9 عملاء جدد. 71% منها جاءت عبر واتساب.' },
        { from: 'user', text: 'في شي لازم انتبه له؟' },
        { from: 'agent', rules: [1, 2], text: 'أمران: الردود على إنستغرام كانت أبطأ يوم الثلاثاء، و4 عملاء لم تصلهم متابعة. هل أوزّعهم على الفريق؟' },
        { from: 'user', text: 'عطيهم لمايا' },
        { from: 'agent', rules: [3], text: 'تم. صاروا عند مايا، والتقرير الكامل بصيغة PDF في بريدك.' },
      ],
      outcome: { title: 'وصل التقرير الأسبوعي', rows: [['المحادثات', '412'], ['الحجوزات', '37'], ['عملاء جدد', '9'], ['المتابعات', '4 أُسندت إلى مايا'], ['التسليم', 'البريد · PDF · الاثنين 09:00']] },
    },
  },
};

// Message slips that float around the base of the tower in the opening scene.
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
