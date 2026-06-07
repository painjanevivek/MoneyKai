import React from 'react';
import { getLearnArticlesByCategorySlug, getLearnCategoryBySlug } from '@/data/learnArticles';
import { LearnCategoryTemplate } from '@/components/marketing/LearnCategoryTemplate';

export default function BudgetingCategoryPage() {
  const category = getLearnCategoryBySlug('budgeting');
  if (!category) return null;
  return <LearnCategoryTemplate category={category} articles={getLearnArticlesByCategorySlug('budgeting')} />;
}
