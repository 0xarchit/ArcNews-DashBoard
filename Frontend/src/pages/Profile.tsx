import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCachedPost } from "@/utils/cache";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, LogOut, Bookmark, ExternalLink, Calendar, Grid, List, SortAsc } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { BookmarkedArticleCard } from "@/components/BookmarkedArticleCard";
import { ArticleModal } from "@/components/ArticleModal";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ViewMode, Article, NewsCategory, SortOption } from "@/types/news";
import { useTheme } from "@/hooks/useTheme";
import { sortArticles } from "@/utils/sorting";

const Profile = () => {
  // Ensure theme is applied on this page mount
  const { theme } = useTheme();
  const { profile, updateProfile, signOut } = useAuth();
  const { bookmarks, loading: bookmarksLoading, removeBookmark, fetchBookmarks } = useBookmarks();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [preferredCategory, setPreferredCategory] = useState(profile?.preferred_category || 'all');
  const [defaultSortBy, setDefaultSortBy] = useState(profile?.default_sort_by || 'newest');
  const [defaultView, setDefaultView] = useState(profile?.default_view || 'list');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Bookmarks view state
  const [bookmarksViewMode, setBookmarksViewMode] = useState<ViewMode>('list');
  const [bookmarksSortBy, setBookmarksSortBy] = useState<SortOption>('newest');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [modalMode, setModalMode] = useState<'summary' | 'content'>('summary');

  // Refresh bookmarks when the profile page opens
  useEffect(() => {
    fetchBookmarks?.();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = [
    'all', 'business', 'entertainment', 'health', 
    'science', 'sports', 'technology'
  ];

  const sortOptions = [
    { value: 'likes-desc', label: 'Most Liked' },
    { value: 'likes-asc', label: 'Least Liked' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' }
  ];

  const viewOptions = [
    { value: 'list', label: 'List View' },
    { value: 'grid', label: 'Grid View' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await updateProfile({
        full_name: fullName,
        preferred_category: preferredCategory,
        default_sort_by: defaultSortBy,
        default_view: defaultView
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Profile updated successfully!",
          description: "Your preferences have been saved.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleViewSummary = (article: Article) => {
    setSelectedArticle(article);
    setModalMode('summary');
  };

  const handleViewContent = (article: Article) => {
    setSelectedArticle(article);
    setModalMode('content');
  };

  // Convert bookmarks to articles for sorting
  const bookmarksAsArticles = bookmarks.map(bookmark => {
    const cat = bookmark.article_category as NewsCategory;
    const post = getCachedPost(cat, bookmark.article_id);
    return {
      id: bookmark.article_id,
      title: bookmark.article_title,
      description: post?.description || '',
      url: bookmark.article_url,
      urlToImage: bookmark.article_image_url,
      publishedAt: bookmark.article_published_at,
      source: bookmark.article_source,
      category: cat,
      likes: post?.likes ?? 0,
      liked_by: post?.liked_by ?? [],
      summary: post?.summary || '',
      content: post?.content || '',
    };
  });

  const sortedBookmarks = sortArticles(bookmarksAsArticles, bookmarksSortBy).map(article => 
    bookmarks.find(b => b.article_id === article.id)!
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4" data-theme={theme}>
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Profile Settings</TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Bookmarks ({bookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Customize your ArcNews experience
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={profile?.username || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      Username cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Preferred Default Category</Label>
                    <Select value={preferredCategory} onValueChange={setPreferredCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sortBy">Default Sort By</Label>
                    <Select value={defaultSortBy} onValueChange={setDefaultSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="view">Default View</Label>
                    <Select value={defaultView} onValueChange={setDefaultView}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {viewOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookmarks">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bookmark className="h-5 w-5" />
                      Saved Articles
                    </CardTitle>
                    <CardDescription>
                      Your bookmarked articles (automatically removed after 7 days)
                    </CardDescription>
                  </div>
                  
                  {bookmarks.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <Select value={bookmarksSortBy} onValueChange={(value) => setBookmarksSortBy(value as SortOption)}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex rounded-md border w-full sm:w-auto overflow-hidden">
                        <Button
                          variant={bookmarksViewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setBookmarksViewMode('list')}
                          className="rounded-r-none flex-1 sm:flex-none"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={bookmarksViewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setBookmarksViewMode('grid')}
                          className="rounded-l-none flex-1 sm:flex-none"
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {bookmarksLoading ? (
                  <LoadingSkeleton viewMode={bookmarksViewMode} />
                ) : bookmarks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bookmarked articles yet</p>
                    <p className="text-sm">Start bookmarking articles from the dashboard</p>
                  </div>
                ) : (
                  <div className={bookmarksViewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-4"
                  }>
          {sortedBookmarks.map((bookmark) => (
                      <BookmarkedArticleCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        viewMode={bookmarksViewMode}
                        onViewSummary={handleViewSummary}
                        onViewContent={handleViewContent}
            onUnbookmark={removeBookmark}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          category={selectedArticle.category}
          mode={modalMode}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
};

export default Profile;