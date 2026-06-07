export type LearnArticle = {
  slug: 'start-budget' | 'shared-expenses' | 'emergency-fund';
  title: string;
  description: string;
  category: string;
  readTime: string;
  keywords: string[];
};

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: 'start-budget',
    title: 'How to start a budget when your money changes every month',
    description:
      'A practical way to build a budget when income, bills, and spending patterns are not perfectly predictable.',
    category: 'Budget Basics',
    readTime: '6 min read',
    keywords: ['flexible budget', 'monthly planning', 'variable income budget'],
  },
  {
    slug: 'shared-expenses',
    title: 'How to manage shared expenses without creating tension',
    description:
      'A simple system for couples, roommates, and families to split costs clearly and keep money conversations calmer.',
    category: 'Shared Money',
    readTime: '5 min read',
    keywords: ['shared expenses', 'split bills', 'household budgeting'],
  },
  {
    slug: 'emergency-fund',
    title: 'What financial first aid looks like before a full emergency fund exists',
    description:
      'The first moves to make when money gets tight and you need breathing room before your safety net is fully built.',
    category: 'Financial First Aid',
    readTime: '7 min read',
    keywords: ['emergency fund', 'financial first aid', 'cash flow plan'],
  },
];
