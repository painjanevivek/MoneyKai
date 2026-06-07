export type LearnCategorySlug = 'budgeting' | 'saving-money' | 'expense-tracking' | 'personal-finance';

export interface LearnFaq {
  question: string;
  answer: string;
}

export interface LearnSubSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  numbered?: string[];
}

export interface LearnSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  numbered?: string[];
  subSections?: LearnSubSection[];
}

export interface LearnArticle {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  description: string;
  category: string;
  categorySlug: LearnCategorySlug;
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  image: {
    alt: string;
    prompt: string;
  };
  tableOfContents: { id: string; label: string }[];
  content: LearnSection[];
  faqs: LearnFaq[];
  keywords: string[];
}

export interface LearnCategory {
  slug: LearnCategorySlug;
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
}

export const LEARN_CATEGORIES: LearnCategory[] = [
  {
    slug: 'budgeting',
    title: 'Budgeting',
    description: 'Simple monthly planning for people who want clarity without complexity.',
    metaTitle: 'Budgeting Articles | MoneyKai Learn',
    metaDescription: 'Read practical budgeting articles from MoneyKai Learn about monthly planning, the 50/30/20 rule, and realistic money routines.',
  },
  {
    slug: 'saving-money',
    title: 'Saving Money',
    description: 'Practical habits for students and everyday users who want to save without feeling deprived.',
    metaTitle: 'Saving Money Articles | MoneyKai Learn',
    metaDescription: 'Discover practical saving money guides from MoneyKai Learn, including emergency funds and student-friendly saving habits.',
  },
  {
    slug: 'expense-tracking',
    title: 'Expense Tracking',
    description: 'Daily expense visibility, cleaner records, and less confusion about where money goes.',
    metaTitle: 'Expense Tracking Articles | MoneyKai Learn',
    metaDescription: 'Explore expense tracking articles from MoneyKai Learn about daily tracking, overspending, and budget tracker comparisons.',
  },
  {
    slug: 'personal-finance',
    title: 'Personal Finance',
    description: 'Foundational personal finance ideas for people who want calmer, more confident money decisions.',
    metaTitle: 'Personal Finance Articles | MoneyKai Learn',
    metaDescription: 'Read beginner-friendly personal finance articles from MoneyKai Learn about money basics, shared expenses, and overspending.',
  },
];

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: 'how-to-track-daily-expenses',
    title: 'How to Track Daily Expenses Without Getting Confused',
    metaTitle: 'How to Track Daily Expenses | MoneyKai Learn',
    metaDescription:
      'Learn how to track daily expenses in a simple way, avoid confusion, and build better money habits with practical examples.',
    excerpt:
      'Daily expenses are easy to forget. This guide explains a simple way to record spending, group expenses, and understand where your money goes.',
    description:
      'Daily expenses are easy to forget, which is why a small, consistent tracking routine can make money decisions much clearer.',
    category: 'Expense Tracking',
    categorySlug: 'expense-tracking',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-01',
    updatedAt: '2026-06-07',
    readingTime: '6 min read',
    image: {
      alt: 'A person reviewing daily expenses on a simple finance dashboard.',
      prompt:
        'Create a clean modern blog hero image showing a person checking daily expenses on a phone or laptop, with simple icons for food, travel, shopping, and bills. Use a calm personal finance style, minimal background, professional and friendly.',
    },
    tableOfContents: [
      { id: 'why-daily-expense-tracking-matters', label: 'Why daily expense tracking matters' },
      { id: 'the-simplest-way-to-start', label: 'The simplest way to start' },
      { id: 'use-simple-categories', label: 'Use simple categories' },
      { id: 'track-at-the-right-time', label: 'Track expenses at the right time' },
      { id: 'small-expenses-add-up', label: 'Do not ignore small expenses' },
      { id: 'practical-example', label: 'Practical example' },
      { id: 'common-mistakes', label: 'Common mistakes to avoid' },
      { id: 'how-moneykai-can-help', label: 'How MoneyKai can help' },
    ],
    content: [
      {
        id: 'why-daily-expense-tracking-matters',
        heading: 'Why daily expense tracking matters',
        paragraphs: [
          'Tracking daily expenses means recording every amount you spend during the day. It may feel small, but this habit reveals patterns that are hard to see from memory alone.',
          'Most people do not overspend because they are careless. They overspend because tiny purchases accumulate quietly over time. When you track daily, those patterns become visible early enough to act on them.',
        ],
        bullets: [
          'See where money actually goes.',
          'Notice categories that drain the budget.',
          'Compare spending against your monthly plan.',
          'Reduce guesswork and make clearer decisions.',
        ],
      },
      {
        id: 'the-simplest-way-to-start',
        heading: 'The simplest way to start',
        paragraphs: [
          'Begin with four details only: amount, date, category, and a short note. That is enough to build the habit without feeling overloaded.',
          'Example: amount ₹120, category Food, note Evening snacks. Another example: amount ₹80, category Travel, note Auto fare. Keep the system small and repeatable.',
        ],
        numbered: [
          'Write the amount.',
          'Add the date.',
          'Choose one category.',
          'Add a short note if it helps.',
        ],
      },
      {
        id: 'use-simple-categories',
        heading: 'Use simple categories',
        paragraphs: ['Too many categories make tracking boring. Start with a small set and expand only when you need more detail.'],
        bullets: ['Food', 'Travel', 'Shopping', 'Bills', 'Rent', 'Health', 'Education', 'Entertainment', 'Savings', 'Other'],
      },
      {
        id: 'track-at-the-right-time',
        heading: 'Track expenses at the right time',
        paragraphs: ['The best time to record a purchase is immediately after you make it. If that is not possible, do a short review at night and update anything you missed.'],
        numbered: [
          'Check your available budget in the morning.',
          'Record major expenses during the day.',
          'Review small purchases before you sleep.',
        ],
      },
      {
        id: 'small-expenses-add-up',
        heading: 'Do not ignore small expenses',
        paragraphs: [
          'Small spending often becomes the biggest surprise. A few cups of tea, an extra auto ride, or a couple of quick online orders can become a meaningful monthly amount.',
          'Once you see the monthly total, it becomes easier to decide what to reduce without feeling confused about the numbers.',
        ],
      },
      {
        id: 'practical-example',
        heading: 'Practical example',
        paragraphs: [
          'Imagine a monthly budget of ₹15,000. After one week you see the following pattern: Food ₹2,400, Travel ₹1,100, Shopping ₹1,800, Entertainment ₹900, and Other ₹700.',
          'That total shows that the month is moving quickly. The point is not to panic. The point is to notice early enough to adjust spending before the month gets tight.',
        ],
      },
      {
        id: 'common-mistakes',
        heading: 'Common mistakes to avoid',
        bullets: [
          'Waiting until the end of the month to enter expenses.',
          'Only recording large purchases and ignoring smaller ones.',
          'Creating too many categories before the habit is stable.',
          'Treating a missed day as failure instead of continuing the next day.',
        ],
      },
      {
        id: 'how-moneykai-can-help',
        heading: 'How MoneyKai can help',
        paragraphs: [
          'MoneyKai is built to make spending, budgets, savings, shared costs, notes, and backups easier to organize in one place. That makes expense tracking less like a chore and more like a quick routine.',
        ],
      },
    ],
    faqs: [
      { question: 'Should I track every single expense?', answer: 'Yes, at least for the first 30 days. That gives you a clear spending baseline.' },
      { question: 'What if I forget an expense?', answer: 'Add it later when you remember. Missing one entry should not stop the habit.' },
      { question: 'How many categories should I use?', answer: 'Start with 8 to 10 simple categories and improve later if needed.' },
      { question: 'Is daily tracking better than monthly tracking?', answer: 'Daily tracking is usually easier because the expense is still fresh in your memory.' },
      { question: 'Can students track expenses too?', answer: 'Yes. Pocket money, food, travel, and subscriptions are all worth tracking.' },
    ],
    keywords: ['daily expenses', 'expense tracking', 'budgeting', 'money habits'],
  },
  {
    slug: 'monthly-budget-planner',
    title: 'How to Create a Monthly Budget That You Can Actually Follow',
    metaTitle: 'How to Create a Monthly Budget | MoneyKai Learn',
    metaDescription:
      'Learn how to create a simple monthly budget, divide income, control spending, and avoid running out of money before month-end.',
    excerpt:
      'A monthly budget helps you plan your income before you spend it. This guide explains a simple budget method for beginners.',
    description:
      'A monthly budget is not about restriction. It is about giving your money a job before the month starts.',
    category: 'Budgeting',
    categorySlug: 'budgeting',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-03',
    updatedAt: '2026-06-07',
    readingTime: '7 min read',
    image: {
      alt: 'A monthly budget plan with income, expenses, and savings sections.',
      prompt:
        'Create a clean blog hero image showing a monthly budget planner with simple sections for income, expenses, savings, and bills. Use a modern personal finance app style with soft minimal design.',
    },
    tableOfContents: [
      { id: 'what-is-a-monthly-budget', label: 'What is a monthly budget?' },
      { id: 'step-1-know-income', label: 'Step 1: Know your monthly income' },
      { id: 'step-2-list-fixed-expenses', label: 'Step 2: List fixed expenses' },
      { id: 'step-3-list-flexible-expenses', label: 'Step 3: List flexible expenses' },
      { id: 'step-4-save-first', label: 'Step 4: Add savings before random spending' },
      { id: 'keep-a-buffer', label: 'Step 5: Keep a small buffer' },
      { id: 'simple-example', label: 'Simple monthly budget example' },
      { id: 'weekly-review', label: 'Weekly review method' },
    ],
    content: [
      {
        id: 'what-is-a-monthly-budget',
        heading: 'What is a monthly budget?',
        paragraphs: [
          'A monthly budget is a plan for one month of income and expenses. It usually includes income, fixed expenses, flexible expenses, savings, and a small buffer for surprises.',
          'The goal is not perfect prediction. The goal is awareness and control so you can spend with more confidence.',
        ],
      },
      {
        id: 'step-1-know-income',
        heading: 'Step 1: Know your monthly income',
        paragraphs: ['Start with the money you actually receive, not the best-case number you hope for. If your income changes often, use a safe average instead of the highest possible month.'],
        bullets: ['Salary', 'Freelance income', 'Pocket money', 'Other regular income'],
      },
      {
        id: 'step-2-list-fixed-expenses',
        heading: 'Step 2: List fixed expenses',
        paragraphs: ['Fixed expenses repeat every month and usually need to be written first because they are hard to avoid.'],
        bullets: ['Rent', 'EMI', 'Internet', 'Phone bill', 'Fees', 'Insurance', 'Subscriptions', 'Transport pass'],
      },
      {
        id: 'step-3-list-flexible-expenses',
        heading: 'Step 3: List flexible expenses',
        paragraphs: ['Flexible expenses change with habits and are often where overspending happens. These are the categories that benefit most from regular review.'],
        bullets: ['Food', 'Travel', 'Shopping', 'Entertainment', 'Eating out', 'Gifts', 'Personal care'],
      },
      {
        id: 'step-4-save-first',
        heading: 'Step 4: Add savings before random spending',
        paragraphs: [
          'Do not wait to save whatever is left. Decide on a savings amount first, then build the rest of the budget around what remains.',
          'Example: if income is ₹30,000 and savings target is ₹3,000, then the budget should be built with ₹27,000. Even a small amount saved consistently is better than waiting for the perfect month.',
        ],
      },
      {
        id: 'keep-a-buffer',
        heading: 'Step 5: Keep a small buffer',
        paragraphs: [
          'Every month has surprises, so a small buffer helps the budget survive things like birthday plans, repair costs, or an unplanned bill.',
          'A buffer of ₹1,000 to ₹2,000 can prevent a small surprise from breaking the whole plan.',
        ],
      },
      {
        id: 'simple-example',
        heading: 'Simple monthly budget example',
        paragraphs: ['Income: ₹30,000. Rent: ₹8,000. Food: ₹6,000. Travel: ₹2,500. Bills: ₹2,000. Savings: ₹4,000. Shopping: ₹2,500. Entertainment: ₹1,500. Buffer: ₹1,500. Other: ₹2,000. Total: ₹30,000.'],
      },
      {
        id: 'weekly-review',
        heading: 'Weekly review method',
        bullets: ['How much did I spend this week?', 'Which category is nearly finished?', 'What should slow down next week?', 'Am I still saving something?'],
      },
    ],
    faqs: [
      { question: 'How much should I save every month?', answer: 'Start with an amount you can keep up consistently, even if it is small.' },
      { question: 'What if my income is irregular?', answer: 'Use your average or lowest expected income to make the budget safer.' },
      { question: 'Should entertainment be included?', answer: 'Yes. A budget without personal enjoyment often fails quickly.' },
      { question: 'How often should I review the budget?', answer: 'A weekly review is a good habit and keeps the plan realistic.' },
      { question: 'What if I cross my budget?', answer: 'Review why it happened and adjust the next week instead of quitting the whole system.' },
    ],
    keywords: ['monthly budget', 'budget planner', 'budgeting', 'personal finance'],
  },
  {
    slug: '50-30-20-budget-rule',
    title: 'What Is the 50/30/20 Budget Rule?',
    metaTitle: '50/30/20 Budget Rule Explained | MoneyKai Learn',
    metaDescription:
      'Understand the 50/30/20 budget rule with simple examples and learn how beginners can use it for needs, wants, and savings.',
    excerpt: 'The 50/30/20 rule is a simple budgeting method that divides income into needs, wants, and savings.',
    description: 'The 50/30/20 rule is one of the easiest ways to give your money a structure when you are just getting started.',
    category: 'Budgeting',
    categorySlug: 'budgeting',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-05',
    updatedAt: '2026-06-07',
    readingTime: '6 min read',
    image: {
      alt: 'A 50/30/20 budget split showing needs, wants, and savings.',
      prompt:
        'Create a simple blog hero image showing a clean 50/30/20 budget split chart with three sections: needs, wants, and savings. Use a modern minimal finance education style.',
    },
    tableOfContents: [
      { id: 'what-are-needs', label: 'What are needs?' },
      { id: 'what-are-wants', label: 'What are wants?' },
      { id: 'what-are-savings', label: 'What are savings?' },
      { id: 'simple-example', label: 'Simple example' },
      { id: 'when-it-works', label: 'When the rule works best' },
      { id: 'when-it-needs-adjusting', label: 'When it may not work perfectly' },
      { id: 'how-to-use-it', label: 'How to use this rule practically' },
    ],
    content: [
      {
        id: 'what-are-needs',
        heading: 'What are needs?',
        paragraphs: ['Needs are expenses you must pay to live and function. These usually include rent, groceries, basic transport, bills, and minimum debt payments.'],
      },
      {
        id: 'what-are-wants',
        heading: 'What are wants?',
        paragraphs: ['Wants improve life but are not absolutely necessary. Examples include eating out, movies, shopping, gaming, and premium subscriptions.'],
      },
      {
        id: 'what-are-savings',
        heading: 'What are savings?',
        paragraphs: ['Savings include money kept for future use such as an emergency fund, short-term goals, or extra debt repayment.'],
      },
      {
        id: 'simple-example',
        heading: 'Simple example',
        paragraphs: ['If monthly income is ₹40,000, the split is roughly ₹20,000 for needs, ₹12,000 for wants, and ₹8,000 for savings or debt repayment.'],
      },
      {
        id: 'when-it-works',
        heading: 'When the rule works best',
        bullets: ['You are new to budgeting.', 'Your income is fairly stable.', 'You want a simple structure.', 'You do not want too many categories.'],
      },
      {
        id: 'when-it-needs-adjusting',
        heading: 'When it may need adjusting',
        paragraphs: ['Some people need to spend more than 50% on needs because of rent, family responsibilities, student costs, or irregular income. That is fine. The percentages are a starting point, not a law.'],
      },
      {
        id: 'how-to-use-it',
        heading: 'How to use this rule practically',
        numbered: ['Write your monthly income.', 'Split it into 50/30/20.', 'Sort each expense into a category.', 'Review where overspending happens.', 'Adjust the split to your real life.'],
      },
    ],
    faqs: [
      { question: 'Is the 50/30/20 rule good for students?', answer: 'Yes, but students often need to adjust the percentages to match pocket money and living costs.' },
      { question: 'Is food a need or a want?', answer: 'Basic groceries are needs. Eating out or expensive food is usually a want.' },
      { question: 'What if I cannot save 20%?', answer: 'Start smaller. Even 5% or 10% is better than not saving at all.' },
      { question: 'Can I use this with irregular income?', answer: 'Yes, but use a conservative income estimate or average month.' },
      { question: 'Is extra debt repayment part of savings?', answer: 'It can be treated as a savings/debt category when you are trying to reduce what you owe.' },
    ],
    keywords: ['50/30/20 rule', 'budgeting', 'needs wants savings', 'personal finance'],
  },
  {
    slug: 'how-students-can-save-money',
    title: 'How Students Can Save Money Without Feeling Restricted',
    metaTitle: 'How Students Can Save Money | MoneyKai Learn',
    metaDescription:
      'Simple and practical money-saving tips for students who want to manage pocket money, reduce wasteful spending, and build better habits.',
    excerpt:
      'Students can save money without completely stopping fun. This guide explains simple habits that make saving easier.',
    description:
      'Students can save more when money is visible, weekly limits are clear, and small wasteful purchases are reduced intentionally.',
    category: 'Saving Money',
    categorySlug: 'saving-money',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-07',
    updatedAt: '2026-06-07',
    readingTime: '6 min read',
    image: {
      alt: 'A student managing pocket money and savings on a phone.',
      prompt:
        'Create a clean friendly blog hero image of a student managing pocket money and savings on a phone, with icons for food, travel, books, and savings. Use a youthful but professional finance style.',
    },
    tableOfContents: [
      { id: 'know-where-money-goes', label: 'Know where your money goes' },
      { id: 'set-weekly-limit', label: 'Set a weekly spending limit' },
      { id: 'save-first', label: 'Save first, not last' },
      { id: 'reduce-food-leakage', label: 'Reduce food leakage' },
      { id: 'be-careful-with-subscriptions', label: 'Be careful with subscriptions' },
      { id: 'use-discounts-well', label: 'Use student discounts wisely' },
      { id: 'build-savings-goal', label: 'Build a reason to save' },
    ],
    content: [
      {
        id: 'know-where-money-goes',
        heading: 'Know where your money goes',
        paragraphs: ['Track spending for at least one week before trying to save aggressively. Once you see the pattern, saving becomes far less mysterious.'],
        bullets: ['Food and snacks', 'Travel', 'Recharge', 'Subscriptions', 'Books and study materials', 'Outings', 'Online shopping'],
      },
      {
        id: 'set-weekly-limit',
        heading: 'Set a weekly spending limit',
        paragraphs: [
          'Weekly limits are easier to follow than monthly ones because they feel smaller and more immediate.',
          'If your monthly pocket money is ₹6,000, a weekly limit of roughly ₹1,500 gives you a clearer pace.',
        ],
      },
      {
        id: 'save-first',
        heading: 'Save first, not last',
        paragraphs: ['When money arrives, move a small part to savings immediately. Even ₹500 out of ₹5,000 creates a savings habit that is easier to repeat.'],
      },
      {
        id: 'reduce-food-leakage',
        heading: 'Reduce food leakage',
        bullets: ['Carry water', 'Plan snacks', 'Avoid random ordering when normal food is available', 'Set a weekly eating-out limit', 'Split costs when with friends'],
      },
      {
        id: 'be-careful-with-subscriptions',
        heading: 'Be careful with subscriptions',
        paragraphs: ['Students often forget to review app subscriptions, streaming plans, and learning tools. Cancel what you do not use regularly.'],
      },
      {
        id: 'use-discounts-well',
        heading: 'Use student discounts wisely',
        paragraphs: ['Discounts help only if you already needed the item. A discount is not a reason to buy something you did not plan to buy.'],
      },
      {
        id: 'build-savings-goal',
        heading: 'Build a reason to save',
        bullets: ['Emergency fund', 'Course fee', 'Laptop or phone', 'Trip', 'Family support', 'Lower stress'],
      },
    ],
    faqs: [
      { question: 'What is the easiest way for students to save?', answer: 'Save a small amount immediately after receiving pocket money.' },
      { question: 'How can students stop overspending with friends?', answer: 'Set a personal weekly limit and be honest about it.' },
      { question: 'Is tracking expenses useful for students?', answer: 'Yes. It shows where pocket money disappears.' },
      { question: 'Should students stop all fun spending?', answer: 'No. The goal is controlled spending, not zero enjoyment.' },
      { question: 'Can small savings matter?', answer: 'Absolutely. Small savings build the habit and reduce financial pressure.' },
    ],
    keywords: ['student savings', 'money habits', 'saving money', 'personal finance'],
  },
  {
    slug: 'how-to-stop-overspending',
    title: 'How to Stop Overspending and Take Control of Your Money',
    metaTitle: 'How to Stop Overspending | MoneyKai Learn',
    metaDescription:
      'Learn why overspending happens and how to control it with simple habits, spending limits, tracking, and practical money routines.',
    excerpt:
      'Overspending is often a habit problem, not a character problem. Learn simple steps to control spending without extreme restriction.',
    description:
      'Overspending usually becomes easier when spending is unclear, automatic, or emotional. A better system makes control feel lighter.',
    category: 'Personal Finance',
    categorySlug: 'personal-finance',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-09',
    updatedAt: '2026-06-07',
    readingTime: '7 min read',
    image: {
      alt: 'A person comparing planned budget and actual spending.',
      prompt:
        'Create a clean modern blog hero image showing a person reviewing planned budget versus actual spending, with simple warning and progress icons. Make it calm, not stressful.',
    },
    tableOfContents: [
      { id: 'why-overspending-happens', label: 'Why overspending happens' },
      { id: 'track-before-judging', label: 'Track before judging' },
      { id: 'set-category-limits', label: 'Set category limits' },
      { id: 'add-waiting-rule', label: 'Add a waiting rule' },
      { id: 'remove-triggers', label: 'Remove easy triggers' },
      { id: 'use-fixed-limits', label: 'Use fixed limits for flexible spending' },
      { id: 'create-reason-to-save', label: 'Create a reason to save' },
      { id: 'after-overspending', label: 'What to do after overspending' },
    ],
    content: [
      {
        id: 'why-overspending-happens',
        heading: 'Why overspending happens',
        bullets: ['No monthly budget', 'No daily expense tracking', 'Emotional buying', 'Easy online payments', 'Peer pressure', 'Offers and discounts', 'Boredom', 'Not checking balance', 'No savings goal'],
      },
      {
        id: 'track-before-judging',
        heading: 'Track before judging',
        paragraphs: ['For 7 days, write down every expense before trying to fix the habit. Tracking first removes guesswork and helps you spot the real pattern.'],
      },
      {
        id: 'set-category-limits',
        heading: 'Set category limits',
        bullets: ['Food delivery: ₹1,500 per month', 'Shopping: ₹2,000 per month', 'Entertainment: ₹1,000 per month', 'Random spending: ₹1,000 per month'],
      },
      {
        id: 'add-waiting-rule',
        heading: 'Add a waiting rule',
        numbered: ['Small purchase: wait 24 hours.', 'Medium purchase: wait 3 days.', 'Big purchase: wait 7 days.'],
      },
      {
        id: 'remove-triggers',
        heading: 'Remove easy triggers',
        bullets: ['Remove saved cards from shopping apps', 'Turn off sale notifications', 'Unsubscribe from promotional emails', 'Avoid shopping when bored', 'Keep a wishlist instead of buying immediately'],
      },
      {
        id: 'use-fixed-limits',
        heading: 'Use fixed limits for flexible spending',
        paragraphs: ['Set a weekly limit for food, snacks, and entertainment. Once the limit is used, wait until the next week instead of quietly borrowing from other categories.'],
      },
      {
        id: 'create-reason-to-save',
        heading: 'Create a reason to save',
        bullets: ['Emergency fund', 'Trip', 'Phone', 'Laptop', 'Family support', 'Debt reduction', 'Course fee'],
      },
      {
        id: 'after-overspending',
        heading: 'What to do after overspending',
        numbered: [
          'Record the expense.',
          'Identify why it happened.',
          'Reduce another category if needed.',
          'Continue the next day.',
        ],
      },
    ],
    faqs: [
      { question: 'Why do I overspend even when I know I should not?', answer: 'Overspending is often emotional or habit-based. Tracking and limits reduce automatic spending.' },
      { question: 'Should I stop all fun spending?', answer: 'No. The goal is controlled spending, not zero enjoyment.' },
      { question: 'What is the best first step?', answer: 'Track all expenses for 7 days.' },
      { question: 'Are discounts bad?', answer: 'Discounts are useful only if you already needed the item.' },
      { question: 'Can budgeting help overspending?', answer: 'Yes. A budget gives clear limits before spending happens.' },
    ],
    keywords: ['overspending', 'spending habits', 'budget control', 'personal finance'],
  },
  {
    slug: 'emergency-fund-guide',
    title: 'Emergency Fund: Why You Need One and How to Start',
    metaTitle: 'Emergency Fund Guide for Beginners | MoneyKai Learn',
    metaDescription:
      'Learn what an emergency fund is, why it matters, and how beginners can start building one slowly and practically.',
    excerpt: 'An emergency fund helps you handle unexpected expenses without panic. Learn how to start with small steps.',
    description:
      'A small emergency fund can turn a stressful surprise into a manageable problem. Starting tiny is still starting.',
    category: 'Saving Money',
    categorySlug: 'saving-money',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-11',
    updatedAt: '2026-06-07',
    readingTime: '7 min read',
    image: {
      alt: 'A safety cushion or savings jar representing an emergency fund.',
      prompt:
        'Create a calm modern blog hero image showing a savings jar or digital wallet with a shield icon, representing an emergency fund and financial safety. Minimal personal finance style.',
    },
    tableOfContents: [
      { id: 'what-is-an-emergency-fund', label: 'What is an emergency fund?' },
      { id: 'why-it-matters', label: 'Why it matters' },
      { id: 'how-much-to-save', label: 'How much should you save?' },
      { id: 'start-with-mini-fund', label: 'Start with a mini emergency fund' },
      { id: 'where-to-keep-it', label: 'Where to keep emergency money' },
      { id: 'build-it-slowly', label: 'How to build it slowly' },
      { id: 'what-counts-as-emergency', label: 'What counts as an emergency?' },
      { id: 'refill-after-use', label: 'Refill after using it' },
    ],
    content: [
      {
        id: 'what-is-an-emergency-fund',
        heading: 'What is an emergency fund?',
        paragraphs: ['An emergency fund is money set aside for sudden and necessary situations, such as medical costs, job loss, repairs, or urgent travel.'],
      },
      {
        id: 'why-it-matters',
        heading: 'Why it matters',
        paragraphs: ['Without emergency money, one surprise can disturb your whole month. An emergency fund gives you options and reduces panic.'],
      },
      {
        id: 'how-much-to-save',
        heading: 'How much should you save?',
        paragraphs: ['A common beginner target is one month of essential expenses. Later, many people aim for 3 to 6 months. Start where you can.'],
      },
      {
        id: 'start-with-mini-fund',
        heading: 'Start with a mini emergency fund',
        bullets: ['₹1,000', '₹2,500', '₹5,000', '₹10,000'],
        paragraphs: ['Even a small fund is better than no fund at all.'],
      },
      {
        id: 'where-to-keep-it',
        heading: 'Where to keep emergency money',
        bullets: ['Separate from daily spending money', 'Easy to access in an emergency', 'Not used for risky bets', 'Simple to understand and manage'],
      },
      {
        id: 'build-it-slowly',
        heading: 'How to build it slowly',
        paragraphs: ['If your goal is ₹10,000 and you save ₹1,000 per month, the target becomes reachable in 10 months. Small, steady saving works.'],
      },
      {
        id: 'what-counts-as-emergency',
        heading: 'What counts as an emergency?',
        bullets: ['Medical need', 'Essential repair', 'Income issue', 'Urgent family need', 'Important unavoidable bill'],
      },
      {
        id: 'refill-after-use',
        heading: 'Refill after using it',
        paragraphs: ['If you use emergency money, rebuild it. The safety net should stay alive instead of disappearing after one problem is solved.'],
      },
    ],
    faqs: [
      { question: 'How much emergency fund should beginners have?', answer: 'Beginners can start small, then grow the fund over time.' },
      { question: 'Is emergency fund the same as savings?', answer: 'It is a type of savings, but it should only be used for urgent situations.' },
      { question: 'Can I invest emergency money?', answer: 'Emergency money should stay safe and accessible. Avoid risky places.' },
      { question: 'What if I cannot save much?', answer: 'Start very small. Even tiny regular amounts build the habit.' },
      { question: 'Should students have one?', answer: 'Yes. Even a small student emergency fund can help with urgent travel, repairs, or unexpected needs.' },
    ],
    keywords: ['emergency fund', 'saving money', 'financial safety', 'personal finance'],
  },
  {
    slug: 'budget-tracker-vs-expense-tracker',
    title: 'Budget Tracker vs Expense Tracker: What Is the Difference?',
    metaTitle: 'Budget Tracker vs Expense Tracker | MoneyKai Learn',
    metaDescription:
      'Understand the difference between a budget tracker and an expense tracker, and learn why using both can improve money management.',
    excerpt:
      'Expense tracking shows where your money went. Budget tracking shows whether you are staying within your plan.',
    description:
      'Expense tracking and budget tracking solve different problems, and together they create a far clearer money system.',
    category: 'Expense Tracking',
    categorySlug: 'expense-tracking',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-13',
    updatedAt: '2026-06-07',
    readingTime: '5 min read',
    image: {
      alt: 'Two panels comparing budget tracking and expense tracking.',
      prompt:
        'Create a clean blog hero image with two simple panels: one showing expense tracking with receipts and categories, and one showing budget tracking with limits and progress bars. Use modern minimal design.',
    },
    tableOfContents: [
      { id: 'what-is-expense-tracker', label: 'What is an expense tracker?' },
      { id: 'what-is-budget-tracker', label: 'What is a budget tracker?' },
      { id: 'simple-difference', label: 'Simple difference' },
      { id: 'why-you-need-both', label: 'Why you need both' },
      { id: 'practical-example', label: 'Practical example' },
      { id: 'which-one-first', label: 'Which one should beginners start with?' },
      { id: 'common-mistake', label: 'Common mistake' },
      { id: 'how-moneykai-fits', label: 'How MoneyKai fits in' },
    ],
    content: [
      {
        id: 'what-is-expense-tracker',
        heading: 'What is an expense tracker?',
        paragraphs: ['An expense tracker records what you already spent. It answers questions like where the money went and which categories were most active.'],
      },
      {
        id: 'what-is-budget-tracker',
        heading: 'What is a budget tracker?',
        paragraphs: ['A budget tracker compares your actual spending with your planned limit. It tells you whether you are on track.'],
      },
      {
        id: 'simple-difference',
        heading: 'Simple difference',
        bullets: ['Expense tracker: looks backward.', 'Budget tracker: looks forward.', 'Expense tracker: records spending.', 'Budget tracker: controls spending.'],
      },
      {
        id: 'why-you-need-both',
        heading: 'Why you need both',
        paragraphs: ['If you only track expenses, you know what happened but not whether it is too much. If you only track a budget, the plan can feel disconnected from reality. Together, they make spending clearer and more useful.'],
      },
      {
        id: 'practical-example',
        heading: 'Practical example',
        paragraphs: ['A food budget of ₹6,000 that already has ₹3,800 spent tells you that you need to slow down for the rest of the month.'],
      },
      {
        id: 'which-one-first',
        heading: 'Which one should beginners start with?',
        paragraphs: ['Start with expense tracking for a short period. Once you understand your real spending pattern, the budget becomes much more realistic.'],
      },
      {
        id: 'common-mistake',
        heading: 'Common mistake',
        paragraphs: ['A frequent mistake is creating a budget without knowing actual spending. That usually produces unrealistic limits and frustration.'],
      },
      {
        id: 'how-moneykai-fits',
        heading: 'How MoneyKai fits in',
        paragraphs: ['MoneyKai helps users organize expenses, budgets, savings, and shared spending in one place so both sides of money management are visible together.'],
      },
    ],
    faqs: [
      { question: 'Is expense tracking enough?', answer: 'It is a good start, but adding a budget gives better control.' },
      { question: 'Should I create a budget first?', answer: 'If you are new, track expenses first for a short time, then create a budget.' },
      { question: 'Can one app do both?', answer: 'Yes. A personal finance app can include both expense tracking and budget tracking.' },
      { question: 'Which is better for overspending?', answer: 'Budget tracking helps control overspending, while expense tracking shows the reason behind it.' },
      { question: 'How often should I check my budget?', answer: 'Weekly checking is a good habit.' },
    ],
    keywords: ['budget tracker', 'expense tracker', 'budgeting', 'tracking'],
  },
  {
    slug: 'personal-finance-for-beginners',
    title: 'Personal Finance for Beginners: A Simple Guide to Start',
    metaTitle: 'Personal Finance for Beginners | MoneyKai Learn',
    metaDescription:
      'A beginner-friendly guide to personal finance, including income, expenses, budgeting, saving, debt awareness, and money habits.',
    excerpt:
      'Personal finance does not need to be complicated. Learn the basic parts of money management in a simple way.',
    description:
      'Personal finance becomes much easier when you understand income, spending, saving, and simple review habits.',
    category: 'Personal Finance',
    categorySlug: 'personal-finance',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-15',
    updatedAt: '2026-06-07',
    readingTime: '8 min read',
    image: {
      alt: 'A beginner-friendly personal finance roadmap.',
      prompt:
        'Create a clean modern blog hero image showing a simple personal finance roadmap with icons for income, expenses, budget, savings, and goals. Friendly beginner-focused style.',
    },
    tableOfContents: [
      { id: 'step-1-understand-income', label: 'Step 1: Understand your income' },
      { id: 'step-2-track-expenses', label: 'Step 2: Track expenses' },
      { id: 'step-3-create-simple-budget', label: 'Step 3: Create a simple budget' },
      { id: 'step-4-start-saving', label: 'Step 4: Start saving' },
      { id: 'step-5-build-emergency-fund', label: 'Step 5: Build an emergency fund' },
      { id: 'step-6-understand-debt', label: 'Step 6: Understand debt carefully' },
      { id: 'step-7-avoid-lifestyle-inflation', label: 'Step 7: Avoid lifestyle inflation' },
      { id: 'step-8-review-weekly', label: 'Step 8: Review money weekly' },
    ],
    content: [
      {
        id: 'step-1-understand-income',
        heading: 'Step 1: Understand your income',
        paragraphs: ['Income is the money you receive from salary, pocket money, freelance work, business, family support, or side income. Start from what is real, not what is hoped for.'],
      },
      {
        id: 'step-2-track-expenses',
        heading: 'Step 2: Track expenses',
        paragraphs: ['Expenses are the money you spend on food, rent, travel, shopping, education, bills, subscriptions, health, and entertainment. Tracking them helps you see reality.'],
      },
      {
        id: 'step-3-create-simple-budget',
        heading: 'Step 3: Create a simple budget',
        paragraphs: ['A beginner budget can simply include needs, wants, savings, and an emergency buffer. You do not need a complicated spreadsheet to begin well.'],
      },
      {
        id: 'step-4-start-saving',
        heading: 'Step 4: Start saving',
        paragraphs: ['Saving means keeping money for future use. Even a small amount, like ₹1,000 from ₹20,000, builds the discipline that bigger goals need later.'],
      },
      {
        id: 'step-5-build-emergency-fund',
        heading: 'Step 5: Build an emergency fund',
        paragraphs: ['An emergency fund protects you from unexpected costs. Start with a small target and increase it gradually over time.'],
      },
      {
        id: 'step-6-understand-debt',
        heading: 'Step 6: Understand debt carefully',
        paragraphs: ['Debt is borrowed money that must be repaid. It is not always bad, but careless debt can create stress because of due dates, interest, and missed payments.'],
      },
      {
        id: 'step-7-avoid-lifestyle-inflation',
        heading: 'Step 7: Avoid lifestyle inflation',
        paragraphs: ['When income increases, spending often rises too. Try to increase savings before increasing lifestyle spending.'],
      },
      {
        id: 'step-8-review-weekly',
        heading: 'Step 8: Review money weekly',
        bullets: ['How much did I spend?', 'Did I cross any limit?', 'What can I reduce?', 'Did I save something?', 'Are any bills coming soon?'],
      },
    ],
    faqs: [
      { question: 'What is personal finance?', answer: 'Personal finance means managing income, expenses, savings, debt, and money decisions.' },
      { question: 'What should beginners do first?', answer: 'Start by tracking expenses for at least one week.' },
      { question: 'Do I need a high income to manage money?', answer: 'No. Money management is useful at every income level.' },
      { question: 'Is saving small amounts useful?', answer: 'Yes. Small savings build the habit and make larger savings easier later.' },
      { question: 'How often should I review my money?', answer: 'Weekly review is simple and effective.' },
    ],
    keywords: ['personal finance', 'money basics', 'budgeting', 'saving'],
  },
  {
    slug: 'how-to-manage-shared-expenses',
    title: 'How to Manage Shared Expenses with Friends, Family, or Roommates',
    metaTitle: 'How to Manage Shared Expenses | MoneyKai Learn',
    metaDescription:
      'Learn how to manage shared expenses clearly with friends, family, couples, or roommates and avoid confusion around group spending.',
    excerpt:
      'Shared expenses can become confusing when nobody tracks them clearly. Learn a simple system to manage group spending.',
    description:
      'Shared spending works best when everyone can see the numbers, understand the split, and review the group regularly.',
    category: 'Personal Finance',
    categorySlug: 'personal-finance',
    author: 'MoneyKai Team',
    publishedAt: '2026-05-17',
    updatedAt: '2026-06-07',
    readingTime: '7 min read',
    image: {
      alt: 'A group of people managing shared expenses together.',
      prompt:
        'Create a clean modern blog hero image showing friends or roommates managing shared expenses on a phone, with icons for rent, groceries, travel, and bills. Friendly and organized style.',
    },
    tableOfContents: [
      { id: 'why-shared-expenses-become-messy', label: 'Why shared expenses become messy' },
      { id: 'create-group', label: 'Step 1: Create a shared expense group' },
      { id: 'record-every-expense', label: 'Step 2: Record every shared expense' },
      { id: 'decide-split-method', label: 'Step 3: Decide the split method' },
      { id: 'review-weekly', label: 'Step 4: Review weekly' },
      { id: 'archive-old-groups', label: 'Step 5: Archive old groups' },
      { id: 'practical-example', label: 'Practical example' },
      { id: 'common-mistakes', label: 'Common mistakes' },
    ],
    content: [
      {
        id: 'why-shared-expenses-become-messy',
        heading: 'Why shared expenses become messy',
        bullets: ['One person pays more often', 'People forget who paid', 'Small expenses are not recorded', 'There is no clear group total', 'Old expenses stay unresolved'],
      },
      {
        id: 'create-group',
        heading: 'Step 1: Create a shared expense group',
        paragraphs: ['Keep shared expenses separate from personal spending. Groups can be named by trip, home, project, or shared purpose.'],
      },
      {
        id: 'record-every-expense',
        heading: 'Step 2: Record every shared expense',
        paragraphs: ['Each shared expense should capture the amount, date, who paid, the purpose, and any useful note.'],
      },
      {
        id: 'decide-split-method',
        heading: 'Step 3: Decide the split method',
        bullets: ['Equal split', 'Custom split', 'Single payer with later settlement'],
      },
      {
        id: 'review-weekly',
        heading: 'Step 4: Review weekly',
        bullets: ['Who paid?', 'What is pending?', 'Are all expenses recorded?', 'Should any group be archived?'],
      },
      {
        id: 'archive-old-groups',
        heading: 'Step 5: Archive old groups',
        paragraphs: ['Trips end, projects finish, and old roommate groups become inactive. Archiving keeps the active list clean and easier to trust.'],
      },
      {
        id: 'practical-example',
        heading: 'Practical example',
        paragraphs: ['If three roommates share rent, groceries, and electricity, the group can track total spending and see who has paid more or less over time.'],
      },
      {
        id: 'common-mistakes',
        heading: 'Common mistakes',
        bullets: ['Not recording small expenses', 'Mixing personal and shared spending', 'Not agreeing on a split method', 'Keeping old groups active forever', 'Waiting too long to settle'],
      },
    ],
    faqs: [
      { question: 'What are shared expenses?', answer: 'Shared expenses are costs paid for a common purpose by two or more people.' },
      { question: 'Who should use shared expense tracking?', answer: 'Friends, roommates, couples, families, and small groups can use it.' },
      { question: 'Should small shared expenses be recorded?', answer: 'Yes. Small expenses can add up and create confusion later.' },
      { question: 'When should I archive a group?', answer: 'Archive a group when the trip, event, project, or shared purpose is finished.' },
      { question: 'Is equal split always best?', answer: 'Not always. Some situations need custom splits based on use or agreement.' },
    ],
    keywords: ['shared expenses', 'group spending', 'roommates', 'personal finance'],
  },
];

export const LEARN_ARTICLE_SLUGS = LEARN_ARTICLES.map((article) => article.slug);

export const getLearnArticleBySlug = (slug: string) => LEARN_ARTICLES.find((article) => article.slug === slug);

export const getLearnArticlesByCategorySlug = (categorySlug: LearnCategorySlug) =>
  LEARN_ARTICLES.filter((article) => article.categorySlug === categorySlug);

export const getLearnCategoryBySlug = (slug: LearnCategorySlug) => LEARN_CATEGORIES.find((category) => category.slug === slug);

export const getFeaturedLearnArticles = () =>
  [...LEARN_ARTICLES]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, 3);

export const getLatestLearnArticles = (count = 4) =>
  [...LEARN_ARTICLES]
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, count);

export const getRelatedLearnArticles = (slug: string, count = 3) =>
  LEARN_ARTICLES.filter((article) => article.slug !== slug).slice(0, count);
