// Type definitions for the news dashboard

export interface Article {
  id: number;
  source: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  summary: string;
  content: string;
  likes: number;
  liked_by: string[];
  category: NewsCategory;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: Article[];
}

export interface CachedNews {
  ts: string;
  expiresAt: string;
  data: NewsResponse;
}

export type NewsCategory = 'all' | 'business' | 'entertainment' | 'health' | 'science' | 'sports' | 'technology';

export type DateFilter = 'today' | 'yesterday' | '3-days-ago' | '5-days-ago';

export type SortOption = 'likes-desc' | 'likes-asc' | 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export type ViewMode = 'grid' | 'list';

export interface DashboardState {
  category: NewsCategory;
  dateFilter: DateFilter | null;
  sortBy: SortOption;
  viewMode: ViewMode;
  searchQuery: string;
  likedArticles: Set<number>;
}

export interface LastUpdateResponse {
  last_refresh: string;
}