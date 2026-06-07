import React from 'react';
import { getLearnArticlesByCategorySlug, getLearnCategoryBySlug } from '@/data/learnArticles';
import { LearnCategoryTemplate } from '@/components/marketing/LearnCategoryTemplate';

export default function ExpenseTrackingCategoryPage() {
  const category = getLearnCategoryBySlug('expense-tracking');
  if (!category) return null;
  return <LearnCategoryTemplate category={category} articles={getLearnArticlesByCategorySlug('expense-tracking')} />;
}
