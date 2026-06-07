import type { NewsCategory, NewsFeedResponse } from '@/types/news';

const rawBaseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.trim() || 'http://localhost:8000';
const backendBaseUrl = rawBaseUrl.replace(/\/$/, '');

class NewsApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'NewsApiError';
  }
}

export async function fetchLiveNews(category: NewsCategory = 'all', refresh = false): Promise<NewsFeedResponse> {
  const url = new URL('/v1/news', backendBaseUrl);
  url.searchParams.set('limit', '18');
  if (category !== 'all') {
    url.searchParams.set('category', category);
  }
  if (refresh) {
    url.searchParams.set('refresh', 'true');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let message = `Unable to load news (${response.status}).`;
      try {
        const payload = await response.json();
        message = payload?.detail || payload?.message || message;
      } catch {
        const text = await response.text();
        if (text) {
          message = text;
        }
      }
      throw new NewsApiError(message, response.status);
    }

    return (await response.json()) as NewsFeedResponse;
  } catch (error) {
    if (error instanceof NewsApiError) {
      throw error;
    }
    throw new NewsApiError('Unable to reach the live news feed.', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

export { NewsApiError };
