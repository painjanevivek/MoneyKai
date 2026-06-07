import React from 'react';
import { getLearnArticlesByCategorySlug, getLearnCategoryBySlug } from '@/data/learnArticles';
import { LearnCategoryTemplate } from '@/components/marketing/LearnCategoryTemplate';

export default function PersonalFinanceCategoryPage() {
  const category = getLearnCategoryBySlug('personal-finance');
  if (!category) return null;
  return <LearnCategoryTemplate category={category} articles={getLearnArticlesByCategorySlug('personal-finance')} />;
}
