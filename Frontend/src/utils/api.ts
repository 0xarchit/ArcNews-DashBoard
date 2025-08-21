import {
  Article,
  NewsResponse,
  NewsCategory,
  LastUpdateResponse,
} from "@/types/news";
import { getCachedNews, setCachedNews } from "./cache";

// Base URL for API from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT = 60000; // 60 seconds

class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "APIError";
  }
}

const fetchWithTimeout = async (
  url: string,
  timeout = REQUEST_TIMEOUT
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new APIError("Request timeout");
    }
    throw error;
  }
};

export const fetchNews = async (
  category: NewsCategory,
  useCache = true
): Promise<NewsResponse> => {
  // Try cache first if enabled
  if (useCache) {
    const cached = getCachedNews(category);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/${category}`);

    if (!response.ok) {
      throw new APIError(
        `Failed to fetch news: ${response.statusText}`,
        response.status
      );
    }

    const data: NewsResponse = await response.json();

    // Cache the successful response
    if (useCache) {
      setCachedNews(category, data);
    }

    return data;
  } catch (error) {
    // If network fails and we have cache, try to use it
    if (useCache && error instanceof APIError) {
      const cached = getCachedNews(category);
      if (cached) {
        console.warn("Network failed, using cached data:", error.message);
        return cached;
      }
    }

    throw error;
  }
};

export const fetchArticleSummary = async (
  category: NewsCategory,
  id: number
): Promise<Article> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/summary?category=${category}&id=${id}`
    );

    if (!response.ok) {
      throw new APIError(
        `Failed to fetch article summary: ${response.statusText}`,
        response.status
      );
    }

    const article: Article = await response.json();
    return article;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Failed to fetch article summary");
  }
};

export const fetchLastUpdate = async (): Promise<LastUpdateResponse | null> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/lastupdate`);

    if (!response.ok) {
      return null;
    }

    const data: LastUpdateResponse = await response.json();
    return data;
  } catch (error) {
    console.warn("Failed to fetch last update:", error);
    return null;
  }
};

export const toggleLike = async (
  username: string,
  category: NewsCategory,
  id: number
): Promise<void> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/likecnt?username=${encodeURIComponent(
        username
      )}&category=${category}&id=${id}`
    );

    if (!response.ok) {
      throw new APIError(
        `Failed to toggle like: ${response.statusText}`,
        response.status
      );
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Failed to toggle like");
  }
};

export const refreshNews = async (): Promise<void> => {
  try {
    await fetchWithTimeout(`${API_BASE_URL}/refresh`, 60000); // 60 seconds timeout for refresh
  } catch (error) {
    console.warn("Failed to trigger news refresh:", error);
    // Don't throw, refresh is best-effort
  }
};
