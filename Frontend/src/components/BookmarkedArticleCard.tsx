import { useState } from 'react';
import { ExternalLink, Eye, FileText, Heart, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Article, ViewMode, NewsCategory } from '@/types/news';
import { Button } from '@/components/ui/button';
import { formatRelativeTime, formatExactDate, getHostname } from '@/utils/dateUtils';
import { toggleLike } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBookmarks } from '@/hooks/useBookmarks';
import { cn } from '@/lib/utils';

interface BookmarkedArticleCardProps {
  bookmark: {
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
  };
  viewMode: ViewMode;
  onViewSummary: (article: Article) => void;
  onViewContent: (article: Article) => void;
  onUnbookmark?: (articleId: number, category: NewsCategory) => Promise<void> | void;
}

const DEFAULT_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

export const BookmarkedArticleCard = ({ bookmark, viewMode, onViewSummary, onViewContent, onUnbookmark }: BookmarkedArticleCardProps) => {
  const [imageError, setImageError] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { removeBookmark } = useBookmarks();
  const [isLiked, setIsLiked] = useState(false); // We don't have like info for bookmarks
  const [likesCount, setLikesCount] = useState(0); // We don't have like info for bookmarks
  const [isLoading, setIsLoading] = useState(false);

  // Convert bookmark to Article format
  const article: Article = {
    id: bookmark.article_id,
    title: bookmark.article_title,
    description: '', // Not stored in bookmark
    url: bookmark.article_url,
    urlToImage: bookmark.article_image_url,
    publishedAt: bookmark.article_published_at,
    source: bookmark.article_source,
    category: bookmark.article_category as NewsCategory,
    likes: likesCount,
    liked_by: [],
    summary: '',
    content: '',
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!profile?.username) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to like articles",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      await toggleLike(profile.username, bookmark.article_category as NewsCategory, bookmark.article_id);
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/dashboard?category=${bookmark.article_category}&id=${bookmark.article_id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Article link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleUnbookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fn = onUnbookmark
      ? onUnbookmark
      : (id: number, category: NewsCategory) => removeBookmark(id, category);
    await fn(bookmark.article_id, bookmark.article_category as NewsCategory);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const imageUrl = imageError || !bookmark.article_image_url ? DEFAULT_IMAGE : bookmark.article_image_url;
  const hostname = getHostname(bookmark.article_url);
  const relativeTime = formatRelativeTime(bookmark.article_published_at);
  const exactTime = formatExactDate(bookmark.article_published_at);

  if (viewMode === 'list') {
    return (
      <div className="news-card p-3 sm:p-4 flex gap-3 sm:gap-4 animate-slide-up">
        <div className="flex-shrink-0">
          <img
            src={imageUrl}
            alt={bookmark.article_title}
            onError={handleImageError}
            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-cover rounded-lg"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <Badge variant="secondary" className="mb-2 text-[11px] sm:text-xs capitalize">
            {bookmark.article_category}
          </Badge>
          <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
            <h3 className="font-semibold text-base sm:text-base md:text-lg leading-tight line-clamp-2 hover:text-primary transition-colors">
              {bookmark.article_title}
            </h3>
            <div className="hidden sm:flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnbookmark}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-primary"
              >
                <BookmarkCheck className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8 p-0",
                  isLiked && "text-news-like hover:text-news-like"
                )}
              >
                <Heart className={cn("h-3 w-3 sm:h-4 sm:w-4", isLiked && "fill-current")} />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              <span className="font-medium truncate max-w-[160px] sm:max-w-none">{hostname}</span>
              <span title={exactTime} className="hidden sm:inline">{relativeTime}</span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {likesCount}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <div className="flex gap-1 sm:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnbookmark}
                  className="h-8 w-8 p-0 text-xs flex-shrink-0 text-primary"
                >
                  <BookmarkCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={cn(
                    "h-8 w-8 p-0 text-xs flex-shrink-0",
                    isLiked && "text-news-like hover:text-news-like"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewSummary(article)}
                className="h-8 px-2 text-xs flex-shrink-0"
              >
                <Eye className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Summary</span>
                <span className="sm:hidden"></span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewContent(article)}
                className="h-8 px-2 text-xs flex-shrink-0"
              >
                <FileText className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
                <span className="sm:hidden"></span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-8 px-2 text-xs flex-shrink-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(bookmark.article_url, '_blank')}
                className="h-8 px-2 text-xs flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* Show relative time on mobile */}
            <div className="sm:hidden mt-1 text-xs text-muted-foreground">
              {relativeTime}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-card overflow-hidden animate-slide-up">
      <div className="relative">
        <img
          src={imageUrl}
          alt={bookmark.article_title}
          onError={handleImageError}
          className="w-full h-40 sm:h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnbookmark}
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur text-primary"
          >
            <BookmarkCheck className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(
              "h-8 w-8 p-0 bg-background/80 backdrop-blur",
              isLiked && "text-news-like hover:text-news-like"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        <Badge variant="secondary" className="mb-2 text-[11px] sm:text-xs capitalize">
          {bookmark.article_category}
        </Badge>
        <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 mb-2 hover:text-primary transition-colors">
          {bookmark.article_title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 sm:mb-4">
          <span className="font-medium truncate max-w-[55%]">{hostname}</span>
          <div className="flex items-center gap-2 sm:gap-3">
            <span title={exactTime}>{relativeTime}</span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {likesCount}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewSummary(article)}
            className="flex-1 h-9 sm:h-8 text-xs"
          >
            <Eye className="mr-1 h-3 w-3" />
            Summary
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewContent(article)}
            className="flex-1 h-9 sm:h-8 text-xs"
          >
            <FileText className="mr-1 h-3 w-3" />
            Content
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnbookmark}
            className="h-9 sm:h-8 px-2 text-xs text-primary"
          >
            <BookmarkCheck className="mr-1 h-3 w-3" />
            Saved
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-9 sm:h-8 px-2 text-xs"
          >
            <Share2 className="mr-1 h-3 w-3" />
            Share
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(bookmark.article_url, '_blank')}
            className="h-9 sm:h-8 px-2 text-xs"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};