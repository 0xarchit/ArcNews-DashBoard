import { NewsResponse, CachedNews, NewsCategory, Article } from "@/types/news";

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

// Per-article post cache keys
export const getPostCacheKey = (category: NewsCategory, id: number): string =>
  `post:${category}:${id}`;

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

// ---- Post (single-article) cache helpers ----
type CachedArticle = {
  ts: string;
  expiresAt: string;
  data: Article;
};

export const getCachedPost = (
  category: NewsCategory,
  id: number
): Article | null => {
  try {
    const cacheKey = getPostCacheKey(category, id);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    const parsedCache: CachedArticle = JSON.parse(cached);
    const now = Date.now();
    if (now < new Date(parsedCache.expiresAt).getTime()) {
      return parsedCache.data;
    }
    localStorage.removeItem(cacheKey);
    return null;
  } catch (error) {
    console.error("Error reading post cache:", error);
    return null;
  }
};

export const setCachedPost = (
  category: NewsCategory,
  id: number,
  article: Article
): void => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION);
    const cacheData: CachedArticle = {
      ts: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      data: article,
    };
    const cacheKey = getPostCacheKey(category, id);
    trySetItemWithEviction(cacheKey, cacheData);
  } catch (error) {
    console.error("Error setting post cache:", error);
  }
};

export const clearCachedPost = (category: NewsCategory, id: number): void => {
  try {
    const cacheKey = getPostCacheKey(category, id);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error("Error clearing post cache:", error);
  }
};

/**
 * Patch helper to apply a like/unlike toggle into cached entries without
 * changing their TTL. This ensures that after a user likes a post, a reload
 * still reflects the correct state even if category caches are up to 1 hour old.
 */
function applyToggleLikeToCachedCategory(
  category: NewsCategory,
  id: number,
  username: string
): { applied: boolean; isLiked?: boolean; newLikes?: number } {
  try {
    const cacheKey = getCacheKey(category);
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return { applied: false };

    const parsed: CachedNews = JSON.parse(raw);
    const articles = parsed?.data?.articles ?? [];
    const idx = articles.findIndex((a: any) => a?.id === id);
    if (idx === -1) return { applied: false };

    const original = articles[idx] as Article & { liked_by?: string[] };
    const likedBy = new Set<string>(
      Array.isArray(original.liked_by) ? original.liked_by : []
    );
    const hadLike = likedBy.has(username);
    const willLike = !hadLike;

    if (willLike) likedBy.add(username);
    else likedBy.delete(username);

    const likesDelta = willLike ? 1 : -1;
    const nextLikes = Math.max(
      0,
      (original as any).likes + (hadLike === willLike ? 0 : likesDelta)
    );

    const updated: Article & { liked_by?: string[] } = {
      ...(original as any),
      likes: nextLikes,
      liked_by: Array.from(likedBy),
    };

    const nextCache: CachedNews = {
      ts: parsed.ts, // preserve timestamps to keep original TTL
      expiresAt: parsed.expiresAt,
      data: {
        ...parsed.data,
        articles: [
          ...articles.slice(0, idx),
          updated as any,
          ...articles.slice(idx + 1),
        ],
      },
    };

    // Write back preserving TTL
    localStorage.setItem(cacheKey, JSON.stringify(nextCache));

    // Also patch the single-post cache if present
    try {
      const postKey = getPostCacheKey(category, id);
      const postRaw = localStorage.getItem(postKey);
      if (postRaw) {
        const postParsed: {
          ts: string;
          expiresAt: string;
          data: Article & { liked_by?: string[] };
        } = JSON.parse(postRaw);
        const postLikedBy = new Set<string>(
          Array.isArray(postParsed.data.liked_by)
            ? postParsed.data.liked_by
            : []
        );
        const postHadLike = postLikedBy.has(username);
        const postWillLike = !postHadLike;
        if (postWillLike) postLikedBy.add(username);
        else postLikedBy.delete(username);
        const postNextLikes = Math.max(
          0,
          (postParsed.data as any).likes +
            (postHadLike === postWillLike ? 0 : postWillLike ? 1 : -1)
        );
        const postNext = {
          ...postParsed,
          data: {
            ...(postParsed.data as any),
            likes: postNextLikes,
            liked_by: Array.from(postLikedBy),
          },
        };
        localStorage.setItem(postKey, JSON.stringify(postNext));
      }
    } catch {}

    return { applied: true, isLiked: willLike, newLikes: nextLikes };
  } catch (error) {
    console.warn("Failed to patch like state into cache:", error);
    return { applied: false };
  }
}

/**
 * Public helper to apply a like toggle to caches for the specific category and
 * also the 'all' category when relevant. TTL is preserved.
 */
export function applyToggleLikeToCache(
  category: NewsCategory,
  id: number,
  username: string
): void {
  // Update the specific category cache
  applyToggleLikeToCachedCategory(category, id, username);
  // If different, also update the aggregated 'all' cache copy
  if (category !== "all") {
    applyToggleLikeToCachedCategory("all", id, username);
  }
}

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

    // Clear expired for both news and post caches
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || (!key.startsWith("news:") && !key.startsWith("post:"))) {
        continue;
      }
      const cached = localStorage.getItem(key);
      if (!cached) continue;
      try {
        const parsed: { expiresAt?: string } = JSON.parse(cached);
        if (!parsed?.expiresAt) {
          localStorage.removeItem(key);
          continue;
        }
        if (now >= new Date(parsed.expiresAt).getTime()) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // Invalid cache data, remove it
        localStorage.removeItem(key);
      }
    }
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
    if (!key || (!key.startsWith("news:") && !key.startsWith("post:")))
      continue;
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

type CachePayload = CachedNews | CachedArticle;

function trySetItemWithEviction(key: string, value: CachePayload) {
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
  value: CachePayload,
  targetBytes: number
): CachePayload {
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
    return limited as CachePayload;
  } catch {
    return value;
  }
}
