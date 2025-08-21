import { NewsResponse, CachedNews, NewsCategory } from "@/types/news";

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const CATEGORY_LIST: NewsCategory[] = [
  "all",
  "business",
  "entertainment",
  "health",
  "science",
  "sports",
  "technology",
];
const MAX_ENTRY_BYTES = 4_000_000; // ~4MB soft limit per entry to avoid quota (browser dependent)

export const getCacheKey = (category: NewsCategory): string =>
  `news:${category}`;

export const getCachedNews = (category: NewsCategory): NewsResponse | null => {
  try {
    const cacheKey = getCacheKey(category);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const parsedCache: CachedNews = JSON.parse(cached);
    const now = Date.now();

    if (now < new Date(parsedCache.expiresAt).getTime()) {
      return parsedCache.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error("Error reading cache:", error);
    return null;
  }
};

export const setCachedNews = (
  category: NewsCategory,
  data: NewsResponse
): void => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION);

    const cacheData: CachedNews = {
      ts: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      data,
    };

    const cacheKey = getCacheKey(category);
    trySetItemWithEviction(cacheKey, cacheData);
  } catch (error) {
    console.error("Error setting cache:", error);
  }
};

export const clearCache = (category?: NewsCategory): void => {
  try {
    if (category) {
      const cacheKey = getCacheKey(category);
      localStorage.removeItem(cacheKey);
    } else {
      // Clear all news cache
      const categories: NewsCategory[] = [
        "all",
        "business",
        "entertainment",
        "health",
        "science",
        "sports",
        "technology",
      ];
      categories.forEach((cat) => {
        const cacheKey = getCacheKey(cat);
        localStorage.removeItem(cacheKey);
      });
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

export const clearExpiredCache = (): void => {
  try {
    const now = Date.now();

    CATEGORY_LIST.forEach((category) => {
      const cacheKey = getCacheKey(category);
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsedCache: CachedNews = JSON.parse(cached);
          if (now >= new Date(parsedCache.expiresAt).getTime()) {
            localStorage.removeItem(cacheKey);
          }
        } catch (error) {
          // Invalid cache data, remove it
          localStorage.removeItem(cacheKey);
        }
      }
    });
  } catch (error) {
    console.error("Error clearing expired cache:", error);
  }
};

// ---- Helpers to reliably set large cache entries ----
function isQuotaExceededError(err: unknown): boolean {
  // Cross-browser QuotaExceeded checks
  const e = err as any;
  return (
    (typeof DOMException !== "undefined" &&
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED")) ||
    e?.code === 22 ||
    e?.number === -2147024882
  );
}

function getAllNewsCacheMeta(): Array<{
  key: string;
  ts: number;
  size: number;
}> {
  const results: Array<{ key: string; ts: number; size: number }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("news:")) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed: CachedNews = JSON.parse(raw);
      results.push({
        key,
        ts: new Date(parsed.ts).getTime(),
        size: raw.length,
      });
    } catch {
      // Invalid JSON; prefer to remove it to reclaim space
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  }
  return results.sort((a, b) => a.ts - b.ts); // oldest first
}

function trySetItemWithEviction(key: string, value: CachedNews) {
  let payload = value;

  const attempt = () => {
    const str = JSON.stringify(payload);
    // Soft guard on entry size; adaptively truncate if too large
    if (
      str.length > MAX_ENTRY_BYTES &&
      payload?.data &&
      Array.isArray((payload as any).data?.articles)
    ) {
      payload = truncateArticlesToFit(payload, MAX_ENTRY_BYTES);
    }
    localStorage.setItem(key, JSON.stringify(payload));
  };

  try {
    attempt();
    return;
  } catch (err) {
    if (!isQuotaExceededError(err)) throw err;
  }

  // 1) Clear expired entries and retry
  try {
    clearExpiredCache();
    attempt();
    return;
  } catch (err) {
    if (!isQuotaExceededError(err)) throw err;
  }

  // 2) Evict oldest news caches until it fits
  let metas = getAllNewsCacheMeta();
  while (metas.length) {
    const victim = metas.shift();
    if (victim) {
      try {
        localStorage.removeItem(victim.key);
      } catch {}
    }
    try {
      attempt();
      return;
    } catch (err) {
      if (!isQuotaExceededError(err)) throw err;
      // continue eviction
    }
  }

  // 3) As a last resort, truncate articles more aggressively and try once more
  if (payload?.data && Array.isArray((payload as any).data?.articles)) {
    payload = truncateArticlesToFit(payload, Math.floor(MAX_ENTRY_BYTES * 0.6));
    try {
      localStorage.setItem(key, JSON.stringify(payload));
      return;
    } catch {}
  }

  // Give up silently; caching disabled for this response to avoid crashing
}

function truncateArticlesToFit(
  value: CachedNews,
  targetBytes: number
): CachedNews {
  try {
    const articles: any[] = (value as any).data?.articles || [];
    if (!Array.isArray(articles) || articles.length === 0) return value;

    // Binary search to find max N that fits
    let lo = 1,
      hi = articles.length,
      best = 0;
    const cloneWithoutArticles = {
      ...value,
      data: { ...(value as any).data, articles: [] },
    } as any;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      cloneWithoutArticles.data.articles = articles.slice(0, mid);
      const len = JSON.stringify(cloneWithoutArticles).length;
      if (len <= targetBytes) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    const limited = {
      ...value,
      data: {
        ...(value as any).data,
        articles: articles.slice(0, Math.max(1, best)),
      },
    } as any;
    return limited as CachedNews;
  } catch {
    return value;
  }
}
