export type ComparisonPage = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroDescription: string;
  directAnswer: string;
  alternativeName: string;
  bestFor: string[];
  comparisonRows: { label: string; moneykai: string; alternative: string }[];
  faqs: { question: string; answer: string }[];
  keywords: string[];
};

export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: 'moneykai-vs-spreadsheets',
    title: 'MoneyKai vs Spreadsheets',
    metaTitle: 'MoneyKai vs Spreadsheets | Personal Finance App Comparison',
    metaDescription:
      'Compare MoneyKai with spreadsheets for expense tracking, budgeting, monthly reviews, shared expenses, privacy, and personal finance workflows.',
    heroTitle: 'MoneyKai vs spreadsheets for personal finance',
    heroDescription:
      'Spreadsheets are flexible, but they rely on manual setup. MoneyKai is built around repeatable finance workflows that help users review money faster.',
    directAnswer:
      'MoneyKai is better than spreadsheets when you want a guided personal finance workflow for expenses, budgets, shared costs, savings, and monthly review. Spreadsheets are better when you want full manual control and are comfortable maintaining formulas, categories, and layouts yourself.',
    alternativeName: 'Spreadsheets',
    bestFor: [
      'People who want a guided finance workspace instead of building templates',
      'Users who review expenses and budgets every month',
      'Households that need shared spending, savings, and monthly review in one place',
    ],
    comparisonRows: [
      { label: 'Setup effort', moneykai: 'Guided workspace with app screens already structured', alternative: 'Manual templates, formulas, and category setup' },
      { label: 'Expense tracking', moneykai: 'Designed for adding and reviewing records repeatedly', alternative: 'Possible, but depends on spreadsheet discipline' },
      { label: 'Budget review', moneykai: 'Dashboard and budget surfaces stay close to transactions', alternative: 'Requires custom formulas and maintenance' },
      { label: 'Shared expenses', moneykai: 'Built as a product flow for group visibility', alternative: 'Usually needs separate tabs or manual sharing' },
      { label: 'Trust model', moneykai: 'User-provided records and review before save', alternative: 'Depends on where the spreadsheet is stored and shared' },
    ],
    faqs: [
      {
        question: 'Is MoneyKai easier than a spreadsheet for budgeting?',
        answer: 'MoneyKai is usually easier if you want a ready-made budgeting and review workflow. A spreadsheet is better if you prefer building every formula and layout yourself.',
      },
      {
        question: 'Can a spreadsheet replace MoneyKai?',
        answer: 'A spreadsheet can replace MoneyKai for users who only need manual tracking. MoneyKai is designed for users who want transactions, budgets, reports, shared expenses, and savings context in one app.',
      },
      {
        question: 'Why choose MoneyKai over a spreadsheet?',
        answer: 'Choose MoneyKai when the main goal is consistent review, not spreadsheet maintenance. The app keeps common personal finance workflows visible and reusable.',
      },
    ],
    keywords: ['MoneyKai vs spreadsheets', 'budget app vs spreadsheet', 'expense tracker spreadsheet alternative'],
  },
  {
    slug: 'moneykai-vs-expense-trackers',
    title: 'MoneyKai vs Basic Expense Trackers',
    metaTitle: 'MoneyKai vs Expense Trackers | Budgeting and Review Comparison',
    metaDescription:
      'Compare MoneyKai with basic expense trackers for budgeting, monthly review, shared expenses, savings, and local backup files.',
    heroTitle: 'MoneyKai vs basic expense trackers',
    heroDescription:
      'A basic expense tracker records spending. MoneyKai is designed to help users review what the spending means across budgets, summaries, groups, and savings.',
    directAnswer:
      'MoneyKai is better than a basic expense tracker when you want expense records to connect with budgets, monthly review, shared expenses, savings, and local backup files. A basic tracker may be enough if you only need a list of purchases.',
    alternativeName: 'Basic expense trackers',
    bestFor: [
      'Users who want financial review, not only transaction logging',
      'People who need budget pressure and category signals',
      'Users who want one workspace for daily spending and longer-term money context',
    ],
    comparisonRows: [
      { label: 'Primary job', moneykai: 'Review money decisions across records, budgets, and reports', alternative: 'Record expenses and show a transaction list' },
      { label: 'Dashboard clarity', moneykai: 'Highlights budget, spending, income, net flow, and next action', alternative: 'Often focuses on totals or recent expenses' },
      { label: 'Monthly summaries', moneykai: 'Keeps user-provided records close to budget and trend views', alternative: 'Usually limited or absent' },
      { label: 'Shared costs', moneykai: 'Includes group and shared expense workflows', alternative: 'Often not supported or separate' },
      { label: 'Backup files', moneykai: 'Supports user-controlled encrypted backup files in the Android release', alternative: 'Varies by product' },
    ],
    faqs: [
      {
        question: 'Is MoneyKai only an expense tracker?',
        answer: 'No. MoneyKai includes expense tracking, but it also supports budgets, shared expenses, savings, summaries, notes, and encrypted backup files.',
      },
      {
        question: 'When is a basic expense tracker enough?',
        answer: 'A basic tracker may be enough when you only need a list of purchases. MoneyKai is more useful when you want to understand and review the bigger money picture.',
      },
      {
        question: 'Does MoneyKai replace budgeting apps too?',
        answer: 'MoneyKai can replace a simple budgeting app for users who want budgeting connected to transaction review, monthly summaries, and broader financial context.',
      },
    ],
    keywords: ['MoneyKai vs expense tracker', 'expense tracker alternative', 'budget app comparison'],
  },
];

export const getComparisonBySlug = (slug: string | undefined) =>
  COMPARISON_PAGES.find((page) => page.slug === slug);
