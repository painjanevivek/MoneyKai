export type NewsCategory = 'all' | 'finance' | 'fintech';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  image?: string | null;
  publishedAt: string;
  category: Exclude<NewsCategory, 'all'>;
  categoryLabel: string;
}

export interface NewsFeedResponse {
  items: NewsItem[];
  category: NewsCategory;
  updatedAt: string;
  cached: boolean;
  stale: boolean;
  sourceCount: number;
}
