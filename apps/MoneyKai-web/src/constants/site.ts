import { COMPARISON_PAGES } from '@/content/comparisons';
import { LEARN_ARTICLES, LEARN_CATEGORIES } from '@/data/learnArticles';

export const SITE = {
  name: 'MoneyKai',
  url: 'https://moneykai.com',
  logoPath: '/brand/moneykai-mark.jpeg',
  supportEmail: 'support@moneykai.app',
  sameAs: [] as string[],
  title: 'MoneyKai | Official Website',
  description:
    'Official website of MoneyKai, a local-first personal finance app for tracking spending, budgets, shared expenses, savings, and encrypted backup files in one calm workspace.',
};

const CORE_PUBLIC_ROUTES_BEFORE_COMPARE = [
  '',
  '/about',
  '/contact',
] as const;

const CORE_PUBLIC_ROUTES_AFTER_COMPARE = [
  '/faq',
  '/features',
  '/features/expense-tracking',
  '/features/budgeting',
  '/features/groups',
  '/features/savings',
  '/features/analytics',
  '/features/backup-restore',
  '/docs',
  '/services',
  '/how-it-works',
  '/pricing',
  '/news',
  '/trust',
  '/security',
  '/financial-first-aid',
  '/privacy-policy',
  '/terms',
] as const;

export const PUBLIC_ROUTES = [
  ...CORE_PUBLIC_ROUTES_BEFORE_COMPARE,
  '/compare',
  ...COMPARISON_PAGES.map((page) => `/compare/${page.slug}` as const),
  ...CORE_PUBLIC_ROUTES_AFTER_COMPARE,
  '/learn',
  ...LEARN_CATEGORIES.map((category) => `/learn/${category.slug}` as const),
  ...LEARN_ARTICLES.map((article) => `/learn/${article.slug}` as const),
] as const;
