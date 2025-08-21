import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { NewsHeader } from '@/components/NewsHeader';
import { CategoryTabs } from '@/components/CategoryTabs';
import { DateFilter } from '@/components/DateFilter';
import { ControlBar } from '@/components/ControlBar';
import { ArticleCard } from '@/components/ArticleCard';
import { ArticleModal } from '@/components/ArticleModal';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { BackToTop } from '@/components/BackToTop';
import { Article, NewsCategory, SortOption, ViewMode, DateFilter as DateFilterType, DashboardState } from '@/types/news';
import { fetchNews } from '@/utils/api';
import { clearCache } from '@/utils/cache';
import { getDashboardState, saveDashboardState } from '@/utils/storage';
import { sortArticles, filterArticles } from '@/utils/sorting';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state for performance optimization
  const [displayedCount, setDisplayedCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 50;
  
  // Modal state
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalMode, setModalMode] = useState<'summary' | 'content' | null>(null);
  
  // Dashboard state - always start with default category on page reload
  const [dashboardState, setDashboardState] = useState(() => {
    try {
      const savedState = getDashboardState();
      return {
        ...savedState,
        category: 'all' as NewsCategory, // Always start with default category
        dateFilter: null,
        searchQuery: '',
      };
    } catch (error) {
      console.error('Failed to load dashboard state, using defaults:', error);
      // Clear corrupted localStorage
      localStorage.removeItem('news-dashboard-state');
      return {
        category: 'all' as NewsCategory,
        dateFilter: null,
        sortBy: 'newest' as SortOption,
        viewMode: 'grid' as ViewMode,
        searchQuery: '',
        likedArticles: new Set<number>()
      };
    }
  });
  
  // Handle shared article links
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const idParam = searchParams.get('id');
    
    if (categoryParam && idParam) {
      // Check if user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in first to view this article",
        });
        navigate('/auth');
        return;
      }
      
      // Set the category from URL
      if (categoryParam !== dashboardState.category) {
        setDashboardState(prev => ({
          ...prev,
          category: categoryParam as any,
        }));
      }
      
      // Find and open the article when articles are loaded
      const articleId = parseInt(idParam);
      const targetArticle = articles.find(article => article.id === articleId);
      
      if (targetArticle) {
        setSelectedArticle(targetArticle);
        setModalMode('summary');
        // Clear URL params after opening
        navigate('/dashboard', { replace: true });
      } else if (articles.length > 0) {
        // Articles loaded but article not found
        toast({
          title: "Article Not Found",
          description: "This post is no longer available",
          variant: "destructive",
        });
        navigate('/dashboard', { replace: true });
      }
    }
  }, [searchParams, articles, user, navigate, toast, dashboardState.category]);

  // Update dashboard state when profile loads (apply user preferences)
  useEffect(() => {
    if (profile) {
      setDashboardState(prev => ({
        ...prev,
        sortBy: (profile.default_sort_by as SortOption) || prev.sortBy,
        viewMode: (profile.default_view as ViewMode) || prev.viewMode,
      }));
    }
  }, [profile]);

  // Computed values
  const filteredArticles = useMemo(() => {
    let filtered = filterArticles(articles, dashboardState.searchQuery);
    
    // Apply date filter if selected
    if (dashboardState.dateFilter) {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      
      switch (dashboardState.dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '3-days-ago':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '5-days-ago':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5);
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
          endDate = new Date();
      }
      
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.publishedAt);
        return articleDate >= startDate && articleDate < endDate;
      });
    }
    
    return sortArticles(filtered, dashboardState.sortBy);
  }, [articles, dashboardState.searchQuery, dashboardState.sortBy, dashboardState.dateFilter]);

  // Get displayed articles for performance optimization
  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, displayedCount);
  }, [filteredArticles, displayedCount]);

  const hasMoreArticles = filteredArticles.length > displayedCount;

  // Load articles when category changes manually
  useEffect(() => {
    console.log(`Category changed to: ${dashboardState.category}`);
    loadArticles(dashboardState.category, false);
  }, [dashboardState.category]);


  // Clear search and date filter when category changes  
  useEffect(() => {
    if (dashboardState.category) {
      console.log(`Clearing filters for category: ${dashboardState.category}`);
      setDashboardState(prev => ({
        ...prev,
        searchQuery: '',
        dateFilter: null
      }));
      // Reset displayed count when category changes
      setDisplayedCount(ITEMS_PER_PAGE);
    }
  }, [dashboardState.category]);

  // Reset displayed count when search or filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [dashboardState.searchQuery, dashboardState.dateFilter, dashboardState.sortBy]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (isLoadingMore || !hasMoreArticles) return;

    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    
    // Load more when user is 200px from bottom
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      setIsLoadingMore(true);
      
      // Add slight delay for smooth UX
      setTimeout(() => {
        setDisplayedCount(prev => prev + ITEMS_PER_PAGE);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [isLoadingMore, hasMoreArticles]);

  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const loadArticles = async (category: NewsCategory, force = false) => {
    try {
      console.log(`Loading articles for category: ${category}, force: ${force}, current articles: ${articles.length}`);
      
      // Always clear articles when switching categories to prevent stale data
      setArticles([]);
      
      // Set appropriate loading state
      if (!articles.length || force) {
        setLoading(true);
      } else {
        setCategoryLoading(true);
      }
      setError(null);
      
      const response = await fetchNews(category, !force);
      console.log(`Successfully loaded ${response.articles?.length || 0} articles for category: ${category}`);
      
      // Add slight delay for smooth animation
      setTimeout(() => {
        setArticles(response.articles || []);
      }, categoryLoading ? 150 : 0);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load articles';
      setError(errorMessage);
      console.error('Error loading articles:', err);
      toast({
        title: "Error loading articles",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setCategoryLoading(false);
      }, categoryLoading ? 200 : 100);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear cache and force refresh
      clearCache(dashboardState.category);
      await loadArticles(dashboardState.category, true);
      toast({
        title: "News refreshed",
        description: "Latest articles have been loaded.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const updateDashboardState = (updates: Partial<DashboardState>) => {
    const newState = { ...dashboardState, ...updates };
    setDashboardState(newState);
    saveDashboardState(updates);
  };

  const handleCategoryChange = (category: NewsCategory) => {
    console.log(`Category changing from ${dashboardState.category} to ${category}`);
    // Reset all filters when changing category to avoid confusion
    setDashboardState(prev => ({
      ...prev,
      category,
      dateFilter: null,
      searchQuery: ''
    }));
    saveDashboardState({ category, dateFilter: null, searchQuery: '' });
  };

  const handleDateFilterChange = (dateFilter: DateFilterType | null) => {
    updateDashboardState({ dateFilter });
  };

  const handleSearchChange = (searchQuery: string) => {
    updateDashboardState({ searchQuery });
  };

  const handleSortChange = (sortBy: SortOption) => {
    updateDashboardState({ sortBy });
  };

  const handleViewModeChange = (viewMode: ViewMode) => {
    updateDashboardState({ viewMode });
  };

  const handleViewSummary = (article: Article) => {
    setSelectedArticle(article);
    setModalMode('summary');
  };

  const handleViewContent = (article: Article) => {
    setSelectedArticle(article);
    setModalMode('content');
  };

  const handleModalClose = () => {
    setSelectedArticle(null);
    setModalMode(null);
  };

  const handleRetry = () => {
    loadArticles(dashboardState.category, true);
  };

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader 
        onRefresh={handleRefresh} 
        isLoading={refreshing}
      />
      
      <CategoryTabs
        activeCategory={dashboardState.category}
        onCategoryChange={handleCategoryChange}
      />
      
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex justify-end">
          <DateFilter
            activeFilter={dashboardState.dateFilter}
            onFilterChange={handleDateFilterChange}
          />
        </div>
      </div>
      
      <ControlBar
        searchQuery={dashboardState.searchQuery}
        onSearchChange={handleSearchChange}
        sortBy={dashboardState.sortBy}
        onSortChange={handleSortChange}
        viewMode={dashboardState.viewMode}
        onViewModeChange={handleViewModeChange}
        totalResults={filteredArticles.length}
        filteredResults={filteredArticles.length}
      />

      <main className="container mx-auto px-4 py-6 relative">
        {/* Loading overlay for category transitions with smooth animation */}
        {categoryLoading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground animate-pulse">Loading {dashboardState.category} news...</p>
            </div>
          </div>
        )}
        
        <div className={`transition-all duration-500 ease-in-out ${categoryLoading ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
          {loading ? (
            <LoadingSkeleton viewMode={dashboardState.viewMode} />
          ) : error ? (
            <EmptyState type="error" onRetry={handleRetry} />
          ) : filteredArticles.length === 0 ? (
            <EmptyState 
              type={dashboardState.searchQuery || dashboardState.dateFilter ? "no-results" : "no-articles"}
              searchQuery={dashboardState.searchQuery}
              onClearSearch={() => handleSearchChange('')}
            />
          ) : (
            <>
              {dashboardState.viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {displayedArticles.map((article, index) => (
                    <div 
                      key={`${dashboardState.category}-${article.id}`}
                      className="animate-scale-in hover-scale"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ArticleCard
                        article={article}
                        viewMode={dashboardState.viewMode}
                        onViewSummary={handleViewSummary}
                        onViewContent={handleViewContent}
                        showCategory={dashboardState.category === 'all'}
                        activeCategory={dashboardState.category}
                        onLikeUpdate={(articleId, newLikeCount, isLiked) => {
                          // Update the article in the current data
                          setArticles(prevArticles => 
                            prevArticles.map(a => 
                              a.id === articleId 
                                ? { ...a, likes: newLikeCount } 
                                : a
                            )
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {displayedArticles.map((article, index) => (
                    <div 
                      key={`${dashboardState.category}-${article.id}`}
                      className="animate-scale-in hover-scale"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <ArticleCard
                        article={article}
                        viewMode={dashboardState.viewMode}
                        onViewSummary={handleViewSummary}
                        onViewContent={handleViewContent}
                        showCategory={dashboardState.category === 'all'}
                        activeCategory={dashboardState.category}
                        onLikeUpdate={(articleId, newLikeCount, isLiked) => {
                          // Update the article in the current data
                          setArticles(prevArticles => 
                            prevArticles.map(a => 
                              a.id === articleId 
                                ? { ...a, likes: newLikeCount } 
                                : a
                            )
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Load more indicator */}
              {hasMoreArticles && (
                <div className="flex justify-center py-8">
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading more articles...</span>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Scroll down to load more articles</p>
                      <p className="text-xs mt-1">
                        Showing {displayedArticles.length} of {filteredArticles.length} articles
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <ArticleModal
        article={selectedArticle}
        category={dashboardState.category}
        mode={modalMode}
        onClose={handleModalClose}
      />
      
      <BackToTop />
    </div>
  );
};

export default Index;
