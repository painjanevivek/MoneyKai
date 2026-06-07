export type PublicFeature = {
  slug: 'expense-tracking' | 'budgeting' | 'groups' | 'savings' | 'analytics' | 'backup-restore';
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  heroTitle: string;
  heroDescription: string;
  benefits: string[];
  useCases: string[];
  faqs: { question: string; answer: string }[];
  keywords: string[];
};

export const PUBLIC_FEATURES: PublicFeature[] = [
  {
    slug: 'expense-tracking',
    title: 'Expense Tracking',
    shortTitle: 'Track every expense with less guesswork',
    description:
      'Record daily spending clearly so it is easier to see where money goes, spot habits, and make better choices.',
    category: 'Expense Tracking',
    heroTitle: 'Track daily expenses before they disappear into memory',
    heroDescription:
      'MoneyKai makes everyday spending easier to log, review, and understand so users can stay closer to reality instead of relying on guesswork.',
    benefits: [
      'Capture daily spending in one place',
      'Review transaction history without scattered notes',
      'See where money is actually going',
      'Build awareness before overspending becomes a pattern',
    ],
    useCases: [
      'Logging day-to-day purchases',
      'Reviewing previous transactions',
      'Understanding recurring spending habits',
      'Keeping a cleaner monthly money record',
    ],
    faqs: [
      {
        question: 'Can I track daily expenses with MoneyKai?',
        answer: 'Yes. MoneyKai is built to help users record and review everyday spending from one place.',
      },
      {
        question: 'Why does expense tracking matter?',
        answer: 'When users can see what they spend, it becomes easier to budget better and notice habits earlier.',
      },
      {
        question: 'Can I look back at previous expenses?',
        answer: 'Yes. MoneyKai includes transaction history so users can review past activity and patterns.',
      },
    ],
    keywords: ['expense tracking app', 'daily expense tracker', 'personal finance tracking'],
  },
  {
    slug: 'budgeting',
    title: 'Budgeting',
    shortTitle: 'Manage monthly budgets with more clarity',
    description:
      'Set budget expectations, keep an eye on monthly flow, and make adjustments before money pressure builds.',
    category: 'Budgeting',
    heroTitle: 'Budgeting that feels practical enough to keep using',
    heroDescription:
      'MoneyKai helps users turn budgets into something useful for everyday life instead of something they abandon after one difficult month.',
    benefits: [
      'Set and review monthly budget expectations',
      'Keep a clearer view of available money',
      'Adjust spending before a month gets away from you',
      'Build stronger habits over time',
    ],
    useCases: [
      'Planning a monthly budget',
      'Checking how spending compares with the plan',
      'Managing allowance-style monthly limits',
      'Reviewing budget health during the month',
    ],
    faqs: [
      {
        question: 'Can I set a monthly budget in MoneyKai?',
        answer: 'Yes. MoneyKai includes budgeting flows that help users organize monthly spending limits and review budget health.',
      },
      {
        question: 'Is MoneyKai only for strict budgets?',
        answer: 'No. It is also useful for people who want a calmer overview and gradual improvement instead of rigid rules.',
      },
      {
        question: 'Does budgeting help with variable spending?',
        answer: 'Yes. Even when spending changes month to month, a visible budget helps users protect essentials and adjust earlier.',
      },
    ],
    keywords: ['budget app', 'monthly budgeting', 'personal budget manager'],
  },
  {
    slug: 'groups',
    title: 'Groups / Shared Expenses',
    shortTitle: 'Keep shared spending organized and easier to trust',
    description:
      'Track shared costs with friends, family, couples, roommates, or small teams without relying on memory or chat threads.',
    category: 'Shared Expenses',
    heroTitle: 'Shared expenses work better when everyone can see the same picture',
    heroDescription:
      'MoneyKai helps users organize group spending, see who paid, and reduce confusion around shared money responsibilities.',
    benefits: [
      'Track who paid for what',
      'Reduce confusion in shared-cost situations',
      'Keep one visible record instead of scattered messages',
      'Support more practical money conversations',
    ],
    useCases: [
      'Roommate bills and rent-related costs',
      'Couples managing shared household spending',
      'Family expense visibility',
      'Small group cost tracking for trips or projects',
    ],
    faqs: [
      {
        question: 'Can MoneyKai help with shared expenses?',
        answer: 'Yes. Groups are designed to make shared spending easier to organize and review.',
      },
      {
        question: 'Who can use group features?',
        answer: 'Friends, roommates, couples, families, and other small shared-cost situations can all benefit.',
      },
      {
        question: 'Why are shared expense records useful?',
        answer: 'A visible record reduces guesswork, memory gaps, and avoidable tension around who paid what.',
      },
    ],
    keywords: ['shared expenses app', 'split bills app', 'group expense tracker'],
  },
  {
    slug: 'savings',
    title: 'Savings',
    shortTitle: 'Keep savings goals visible instead of easy to forget',
    description:
      'Track savings progress and stay connected to the habits that help users build a stronger financial cushion.',
    category: 'Savings',
    heroTitle: 'Savings improve when progress stays visible',
    heroDescription:
      'MoneyKai helps users keep savings goals in view so they can move from good intentions to more consistent action.',
    benefits: [
      'Keep savings progress visible',
      'Support better consistency over time',
      'Connect savings with broader budgeting habits',
      'Build a stronger buffer for future stress',
    ],
    useCases: [
      'Tracking short-term savings progress',
      'Supporting emergency-fund habits',
      'Keeping savings in mind during monthly reviews',
      'Staying motivated with visible progress',
    ],
    faqs: [
      {
        question: 'Can I track savings with MoneyKai?',
        answer: 'Yes. MoneyKai includes savings-related views and planning support to help users stay aware of their progress.',
      },
      {
        question: 'Why is savings visibility important?',
        answer: 'Savings goals are easy to forget when they are not part of the regular money picture. Visibility helps keep them active.',
      },
      {
        question: 'Does this connect to emergency planning?',
        answer: 'Yes. Savings habits and financial first-aid planning support each other when users need more stability.',
      },
    ],
    keywords: ['savings tracker', 'personal savings app', 'emergency fund habits'],
  },
  {
    slug: 'analytics',
    title: 'Analytics',
    shortTitle: 'Understand spending patterns, not just individual transactions',
    description:
      'Review trends and categories so users can learn from their money behavior and make smarter monthly decisions.',
    category: 'Analytics',
    heroTitle: 'Understand your spending patterns with clearer analytics',
    heroDescription:
      'MoneyKai turns transaction history into something more useful by helping users review categories, patterns, and changes over time.',
    benefits: [
      'See spending trends more clearly',
      'Understand categories instead of isolated purchases',
      'Review progress month to month',
      'Use insights to improve future decisions',
    ],
    useCases: [
      'Monthly spending reviews',
      'Category-by-category analysis',
      'Spotting overspending patterns',
      'Improving budget decisions with real data',
    ],
    faqs: [
      {
        question: 'What can I see in MoneyKai Analytics?',
        answer: 'Analytics helps users review spending patterns, categories, and overall financial movement from one place.',
      },
      {
        question: 'Does analytics help with budgeting?',
        answer: 'Yes. When users understand where money goes, it becomes easier to adjust a budget with confidence.',
      },
      {
        question: 'Is analytics useful for monthly reviews?',
        answer: 'Yes. It is especially helpful for recurring review habits and understanding what changed over time.',
      },
    ],
    keywords: ['spending analytics', 'budget analytics', 'personal finance insights'],
  },
  {
    slug: 'backup-restore',
    title: 'Backup & Restore',
    shortTitle: 'Protect continuity with backup and restore support',
    description:
      'Keep important finance records available and reduce the risk of losing continuity across devices or sessions.',
    category: 'Backup and Restore',
    heroTitle: 'Backup and restore help a finance record stay useful over time',
    heroDescription:
      'MoneyKai treats continuity as part of trust. Backup and restore support helps users recover key records and keep moving with less disruption.',
    benefits: [
      'Reduce the risk of losing important records',
      'Support continuity across sessions and devices',
      'Make recovery easier when users need it',
      'Strengthen trust in long-term use',
    ],
    useCases: [
      'Recovering finance data after disruption',
      'Continuing from another device where supported',
      'Keeping long-term tracking more resilient',
      'Supporting trust for account-based use',
    ],
    faqs: [
      {
        question: 'What does backup and restore do in MoneyKai?',
        answer: 'It helps preserve supported account data so users can recover it later and continue with less disruption.',
      },
      {
        question: 'Why is backup important in a finance app?',
        answer: 'A finance record becomes more valuable over time, so continuity matters as much as day-to-day features.',
      },
      {
        question: 'Can backup and restore help when switching devices?',
        answer: 'Where supported, yes. The goal is to help users reconnect to saved data and continue more smoothly.',
      },
    ],
    keywords: ['backup restore app', 'finance data backup', 'budget app continuity'],
  },
];

export const HOME_FAQS = [
  {
    question: 'What is MoneyKai?',
    answer:
      'MoneyKai is a personal finance app that helps users track expenses, manage budgets, organize shared spending, monitor savings, and understand spending patterns.',
  },
  {
    question: 'Is MoneyKai free?',
    answer:
      'The current public product positioning does not present paid tiers as the main experience. Users can get started without a complicated pricing structure.',
  },
  {
    question: 'Can I track expenses with MoneyKai?',
    answer:
      'Yes. Expense tracking is one of the core product flows and supports day-to-day money visibility.',
  },
  {
    question: 'Can I manage shared expenses?',
    answer:
      'Yes. Groups help users keep shared costs clearer for roommates, couples, families, and other small shared setups.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'MoneyKai uses secure login, clear data handling explanations, and backup continuity support while avoiding exaggerated security claims.',
  },
  {
    question: 'Does MoneyKai give financial advice?',
    answer:
      'No. MoneyKai helps users organize personal finance information, but it does not replace professional financial advice.',
  },
];
