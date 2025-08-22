import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Article, NewsCategory } from "@/types/news";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { getCachedPost, setCachedPost, clearCachedPost } from "@/utils/cache";
import { fetchPost } from "@/utils/api";

interface Bookmark {
  id: string;
  user_id: string;
  article_id: number;
  article_category: string;
  article_title: string;
  article_source: string;
  article_url: string;
  article_image_url: string | null;
  article_published_at: string;
  created_at: string;
}

// ---- Shared cache across all hook instances ----
const CACHE_TTL_MS = 60_000; // 1 minute; adjust as needed

let cacheUserId: string | null = null;
let cacheUpdatedAt = 0;
let cachedBookmarks: Bookmark[] = [];
let cachedIds = new Set<string>();
let cachedLoading = false;
let inFlight: Promise<void> | null = null;

type Listener = (state: {
  bookmarks: Bookmark[];
  ids: Set<string>;
  loading: boolean;
}) => void;

const listeners = new Set<Listener>();

function notify() {
  const snapshot = {
    bookmarks: cachedBookmarks,
    ids: new Set(cachedIds),
    loading: cachedLoading,
  };
  listeners.forEach((l) => l(snapshot));
}

async function fetchBookmarksShared(
  userId: string,
  toast?: ReturnType<typeof useToast>["toast"]
) {
  // De-dupe if a fetch is already running
  if (inFlight) return inFlight;

  // Respect TTL if cache is warm for the same user
  const freshForSameUser =
    cacheUserId === userId && Date.now() - cacheUpdatedAt < CACHE_TTL_MS;
  if (freshForSameUser) return;

  cachedLoading = true;
  notify();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  inFlight = (async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", userId)
        .gte("article_published_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      cachedBookmarks = data || [];
      cachedIds = new Set(
        cachedBookmarks.map((b) => `${b.article_id}-${b.article_category}`)
      );
      cacheUserId = userId;
      cacheUpdatedAt = Date.now();

      // Prefetch and cache post details for any missing items (best-effort)
      // Run sequentially with small concurrency to avoid flooding the API
      const toFetch = cachedBookmarks.filter(
        (b) => !getCachedPost(b.article_category as NewsCategory, b.article_id)
      );
      for (const b of toFetch) {
        try {
          const post = await fetchPost(
            b.article_category as NewsCategory,
            b.article_id
          );
          setCachedPost(b.article_category as NewsCategory, b.article_id, post);
        } catch (e) {
          // ignore fetch errors; cache remains cold
        }
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      toast?.({
        title: "Error",
        description: "Failed to fetch bookmarks",
        variant: "destructive",
      });
    } finally {
      cachedLoading = false;
      notify();
      inFlight = null;
    }
  })();

  return inFlight;
}

// ---- Hook (uses shared store) ----
export const useBookmarks = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(cachedBookmarks);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(cachedIds)
  );
  const [loading, setLoading] = useState<boolean>(cachedLoading);

  // Subscribe to shared store updates
  useEffect(() => {
    const listener: Listener = ({ bookmarks, ids, loading }) => {
      setBookmarks(bookmarks);
      // Create a new Set to trigger renders
      setBookmarkedIds(new Set(ids));
      setLoading(loading);
    };
    listeners.add(listener);
    // Push current snapshot immediately
    listener({
      bookmarks: cachedBookmarks,
      ids: cachedIds,
      loading: cachedLoading,
    });
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Ensure a single fetch for the current user
  useEffect(() => {
    if (!user) {
      // Reset cache and local state on sign-out
      cacheUserId = null;
      cacheUpdatedAt = 0;
      cachedBookmarks = [];
      cachedIds = new Set();
      cachedLoading = false;
      notify();
      return;
    }
    fetchBookmarksShared(user.id, toast);
  }, [user?.id]);

  // Public API

  const fetchBookmarks = async () => {
    if (!user) return;
    // Force bypass TTL by resetting timestamp
    cacheUpdatedAt = 0;
    await fetchBookmarksShared(user.id, toast);
  };

  const addBookmark = async (article: Article, category: NewsCategory) => {
    if (!user) return;
    if (!category) {
      toast({
        title: "Error",
        description: "Unable to determine article category",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        article_id: article.id,
        article_category: category,
        article_title: article.title,
        article_source: article.source,
        article_url: article.url,
        article_image_url: article.urlToImage,
        article_published_at: article.publishedAt,
      });

      if (error) throw error;

      // Optimistically update cache
      const key = `${article.id}-${category}`;
      cachedIds.add(key);
      // Let server be the source of truth for list order; refetch once
      notify();
      await fetchBookmarksShared(user.id, toast);

      // Store or refresh the post cache for this newly bookmarked article
      try {
        const existing = getCachedPost(category, article.id);
        if (!existing) {
          // If article isn't full, or likes might be stale, fetch to hydrate
          const post = await fetchPost(category, article.id);
          setCachedPost(category, article.id, post);
        } else {
          setCachedPost(category, article.id, existing);
        }
      } catch {}

      toast({
        title: "Bookmarked",
        description: "Article saved to bookmarks",
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        toast({
          title: "Already bookmarked",
          description: "This article is already in your bookmarks",
          variant: "destructive",
        });
      } else {
        console.error("Error adding bookmark:", error);
        toast({
          title: "Error",
          description: "Failed to bookmark article",
          variant: "destructive",
        });
      }
    }
  };

  const removeBookmark = async (articleId: number, category: NewsCategory) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("article_id", articleId)
        .eq("article_category", category);

      if (error) throw error;

      // Optimistically update cache
      const key = `${articleId}-${category}`;
      cachedIds.delete(key);
      cachedBookmarks = cachedBookmarks.filter(
        (b) => !(b.article_id === articleId && b.article_category === category)
      );
      notify();

      // Clear the per-article post cache so next view reflects unbookmarked state if needed
      try {
        clearCachedPost(category, articleId);
      } catch {}

      toast({
        title: "Removed",
        description: "Article removed from bookmarks",
      });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      });
    }
  };

  const isBookmarked = (articleId: number, category: NewsCategory) => {
    return bookmarkedIds.has(`${articleId}-${category}`);
  };

  return {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    isBookmarked,
    fetchBookmarks,
  };
};
