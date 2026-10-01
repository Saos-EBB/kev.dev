import type { Translations } from './types'
import { en } from './en'

export const ar = {
  ...en,
  footer: {
    impressum: 'المعلومات القانونية',
    datenschutz: 'سياسة الخصوصية',
  },
  b2b: {
    nav: {
      features: 'الميزات',
      licensing: 'التراخيص',
      contact: 'تواصل معنا',
      cta: 'طلب عرض توضيحي',
    },
    hero: {
      badge: 'White-Label SaaS · منصتك.',
      line1: 'المنصة الاجتماعية',
      line2_light: 'للمنظمات المسؤولة.',
      line2_dark: 'بجانب خفي.',
      sub_light: 'YourBrand هو حل SaaS قابل للترخيص — متوافق مع GDPR، وسهل الوصول، وآمن. وحدات قابلة للتجميع بحرية: أنت تقرر ما يكون نشطاً.',
      sub_dark: 'YourBrand يتضمن Hidden Zone مع معارك Beef، واقتصاد العملات، وحلقة تحقيق الدخل. وحدات قابلة للتجميع بحرية — حصراً لمستخدمي الطاقة.',
      cta: 'طلب عرض توضيحي',
      video: 'مشاهدة فيديو المنتج',
    },
    modules: {
      heading: 'وحدات قابلة للتجميع بحرية',
      sub: 'المصادقة، الإعداد، الدردشة، التلعيب — فعّل ما تحتاجه. لا حزم ثابتة.',
      auth: 'المصادقة وتسجيل الدخول',
      onboarding: 'الإعداد؟',
      modules: 'الوحدات',
      app: 'تطبيقك',
      note: 'اختياري — أنت تقرر ما يكون نشطاً',
      always: 'دائماً',
    },
    cliffhanger: {
      text: 'كان هذا الجانب النظيف.',
      cta: 'الوضع الداكن يحتوي على الجزء الممتع ←',
    },
    features: {
      label: 'ما يتضمنه YourBrand',
    },
    tiers: {
      label: 'خطط الترخيص',
      popular: 'الأكثر شعبية',
      cta: 'طلب عرض أسعار',
    },
    contact: {
      heading: 'تواصل معنا',
      sub: 'المسدس — انقر عليه.',
    },
    tech: {
      toggle: 'التفاصيل التقنية',
      heading: 'لصانعي القرار ذوي الخلفية التقنية',
    },
    footer: {
      text: '© 2025 YourBrand · White-Label SaaS للمنظمات',
    },
  },
} satisfies Translations
