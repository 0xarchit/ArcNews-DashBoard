import { DashboardState, SortOption, ViewMode, NewsCategory, DateFilter } from '@/types/news';

const STORAGE_KEYS = {
  DASHBOARD_STATE: 'news-dashboard-state',
  LIKED_ARTICLES: 'liked-articles',
  THEME: 'theme'
} as const;

// Dashboard state persistence
export const saveDashboardState = (state: Partial<DashboardState>): void => {
  try {
    const current = getDashboardState();
    const updated = { ...current, ...state };
    // Convert Set to Array for storage
    const serializable = {
      ...updated,
      likedArticles: Array.from(updated.likedArticles)
    };
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_STATE, JSON.stringify(serializable));
  } catch (error) {
    console.error('Error saving dashboard state:', error);
  }
};

export const getDashboardState = (): DashboardState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DASHBOARD_STATE);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        category: parsed.category || 'all',
        dateFilter: parsed.dateFilter || null,
        sortBy: parsed.sortBy || 'newest',
        viewMode: parsed.viewMode || 'grid',
        searchQuery: parsed.searchQuery || '',
        likedArticles: new Set(Array.isArray(parsed.likedArticles) ? parsed.likedArticles : [])
      };
    }
  } catch (error) {
    console.error('Error loading dashboard state:', error);
  }

  // Default state
  return {
    category: 'all',
    dateFilter: null,
    sortBy: 'newest',
    viewMode: 'grid',
    searchQuery: '',
    likedArticles: new Set()
  };
};

// Liked articles management
export const toggleLikedArticle = (articleId: number): boolean => {
  try {
    const current = getLikedArticles();
    const isLiked = current.has(articleId);
    
    if (isLiked) {
      current.delete(articleId);
    } else {
      current.add(articleId);
    }
    
    localStorage.setItem(STORAGE_KEYS.LIKED_ARTICLES, JSON.stringify(Array.from(current)));
    return !isLiked;
  } catch (error) {
    console.error('Error toggling liked article:', error);
    return false;
  }
};

export const getLikedArticles = (): Set<number> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LIKED_ARTICLES);
    if (saved) {
      const parsed = JSON.parse(saved);
      return new Set(parsed);
    }
  } catch (error) {
    console.error('Error loading liked articles:', error);
  }
  return new Set();
};

export const isArticleLiked = (articleId: number): boolean => {
  return getLikedArticles().has(articleId);
};

// Theme management
export const saveTheme = (theme: 'light' | 'dark' | 'system'): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
};

export const getTheme = (): 'light' | 'dark' | 'system' => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as 'light' | 'dark' | 'system';
    }
  } catch (error) {
    console.error('Error loading theme:', error);
  }
  return 'system';
};