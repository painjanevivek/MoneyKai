import React from 'react';
import { getLearnArticlesByCategorySlug, getLearnCategoryBySlug } from '@/data/learnArticles';
import { LearnCategoryTemplate } from '@/components/marketing/LearnCategoryTemplate';

export default function SavingMoneyCategoryPage() {
  const category = getLearnCategoryBySlug('saving-money');
  if (!category) return null;
  return <LearnCategoryTemplate category={category} articles={getLearnArticlesByCategorySlug('saving-money')} />;
}
