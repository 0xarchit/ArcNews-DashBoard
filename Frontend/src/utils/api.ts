import {
  Article,
  NewsResponse,
  NewsCategory,
  LastUpdateResponse,
} from "@/types/news";
import {
  getCachedNews,
  setCachedNews,
  getCachedPost,
  setCachedPost,
  clearCachedPost,
} from "./cache";
import { applyToggleLikeToCache } from "./cache";

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

// De-dupe in-flight single-post requests
const inflightPosts = new Map<string, Promise<Article>>();

// Fetch a single post (full article) by category and id
export const fetchPost = async (
  category: NewsCategory,
  id: number
): Promise<Article> => {
  // Try post cache first
  const cached = getCachedPost(category, id);
  if (cached) return cached;
  const key = `${category}:${id}`;
  const existing = inflightPosts.get(key);
  if (existing) return existing;
  try {
    const promise = fetchWithTimeout(
      `${API_BASE_URL}/post?category=${category}&id=${id}`
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new APIError(
            `Failed to fetch post: ${response.statusText}`,
            response.status
          );
        }
        const article: Article = await response.json();
        // Cache the single post
        setCachedPost(category, id, article);
        return article;
      })
      .finally(() => {
        inflightPosts.delete(key);
      });
    inflightPosts.set(key, promise);
    const article = await promise;
    return article;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Failed to fetch post");
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
  userId: string,
  username: string,
  category: NewsCategory,
  id: number
): Promise<void> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/likecnt?userid=${encodeURIComponent(
        userId
      )}&username=${encodeURIComponent(username)}&category=${category}&id=${id}`
    );

    if (!response.ok) {
      throw new APIError(
        `Failed to toggle like: ${response.statusText}`,
        response.status
      );
    }

    // Patch cached lists and post to immediately reflect like state while preserving TTL
    try {
      applyToggleLikeToCache(category, id, username);
    } catch {}

    // Optionally clear cached post (kept for safety) so next open refetches fresh server state
    try {
      clearCachedPost(category, id);
    } catch {}
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
  }
};
