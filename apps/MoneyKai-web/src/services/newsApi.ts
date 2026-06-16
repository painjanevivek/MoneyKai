import type { NewsCategory, NewsFeedResponse } from '@/types/news';

const normalizeBackendBaseUrl = (value: string | undefined): string => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return 'http://localhost:8000';
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/$/, '');
};

const backendBaseUrl = normalizeBackendBaseUrl(process.env.EXPO_PUBLIC_BACKEND_BASE_URL);

class NewsApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'NewsApiError';
  }
}

const parseNewsErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const text = await response.text().catch(() => '');
  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text);
    return payload?.detail || payload?.message || fallback;
  } catch {
    return text;
  }
};

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
      const message = await parseNewsErrorMessage(response, `Unable to load news (${response.status}).`);
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
