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

interface ArticleCardProps {
  article: Article;
  viewMode: ViewMode;
  onViewSummary: (article: Article) => void;
  onViewContent: (article: Article) => void;
  onLikeUpdate?: (articleId: number, newLikeCount: number, isLiked: boolean) => void;
  showCategory?: boolean;
  activeCategory?: NewsCategory; // current page category as fallback
}

const DEFAULT_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';

export const ArticleCard = ({ article, viewMode, onViewSummary, onViewContent, onLikeUpdate, showCategory = false, activeCategory }: ArticleCardProps) => {
  const [imageError, setImageError] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  // Use article.category when available, otherwise fall back to the active page category
  const effectiveCategory = (article.category ?? activeCategory) as NewsCategory;
  const [isLiked, setIsLiked] = useState(() => {
    if (!profile?.username) return false;
    return article.liked_by.includes(profile.username);
  });
  const [likesCount, setLikesCount] = useState(article.likes);
  const [isLoading, setIsLoading] = useState(false);

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
      await toggleLike(profile.username, article.category, article.id);
      onLikeUpdate?.(article.id, isLiked ? likesCount - 1 : likesCount + 1, !isLiked);
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
    
    const shareUrl = `${window.location.origin}/dashboard?category=${article.category}&id=${article.id}`;
    
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

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to bookmark articles",
        variant: "destructive",
      });
      return;
    }

  const currentCategory = effectiveCategory;
    if (isBookmarked(article.id, currentCategory)) {
      await removeBookmark(article.id, currentCategory);
    } else {
      await addBookmark(article, currentCategory);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const imageUrl = imageError || !article.urlToImage ? DEFAULT_IMAGE : article.urlToImage;
  const hostname = getHostname(article.url);
  const relativeTime = formatRelativeTime(article.publishedAt);
  const exactTime = formatExactDate(article.publishedAt);

  if (viewMode === 'list') {
    return (
      <div className="news-card p-3 sm:p-4 flex gap-3 sm:gap-4 animate-slide-up">
        <div className="flex-shrink-0">
          <img
            src={imageUrl}
            alt={article.title}
            onError={handleImageError}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-cover rounded-lg"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          {showCategory && (
            <Badge variant="secondary" className="mb-2 text-xs capitalize">
              {article.category}
            </Badge>
          )}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm sm:text-base md:text-lg leading-tight line-clamp-2 hover:text-primary transition-colors">
              {article.title}
            </h3>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                {isBookmarked(article.id, effectiveCategory) ? (
                  <BookmarkCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
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
          
          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3">
            {article.description}
          </p>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              <span className="font-medium truncate max-w-[120px] sm:max-w-none">{hostname}</span>
              <span title={exactTime} className="hidden sm:inline">{relativeTime}</span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {likesCount}
              </span>
            </div>
            
            <div className="flex items-center gap-1 flex-wrap">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className="h-6 sm:h-7 w-6 sm:w-7 p-0 text-xs flex-shrink-0"
                >
                  {isBookmarked(article.id, effectiveCategory) ? (
                    <BookmarkCheck className="h-3 w-3" />
                  ) : (
                    <Bookmark className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={cn(
                    "h-6 sm:h-7 w-6 sm:w-7 p-0 text-xs flex-shrink-0",
                    isLiked && "text-news-like hover:text-news-like"
                  )}
                >
                  <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewSummary(article)}
                className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs flex-shrink-0"
              >
                <Eye className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Summary</span>
                <span className="sm:hidden"></span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewContent(article)}
                className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs flex-shrink-0"
              >
                <FileText className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Content</span>
                <span className="sm:hidden"></span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs flex-shrink-0"
              >
                <Share2 className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(article.url, '_blank')}
                className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs flex-shrink-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Show relative time on mobile */}
          <div className="sm:hidden mt-1 text-xs text-muted-foreground">
            {relativeTime}
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
          alt={article.title}
          onError={handleImageError}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className="h-8 w-8 p-0 bg-background/80 backdrop-blur"
          >
            {isBookmarked(article.id, effectiveCategory) ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
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
      
      <div className="p-4">
        {showCategory && (
          <Badge variant="secondary" className="mb-2 text-xs capitalize">
            {article.category}
          </Badge>
        )}
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2 hover:text-primary transition-colors">
          {article.title}
        </h3>
        
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
          {article.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="font-medium">{hostname}</span>
          <div className="flex items-center gap-3">
            <span title={exactTime}>{relativeTime}</span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {likesCount}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewSummary(article)}
            className="flex-1 h-8 text-xs"
          >
            <Eye className="mr-1 h-3 w-3" />
            Summary
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewContent(article)}
            className="flex-1 h-8 text-xs"
          >
            <FileText className="mr-1 h-3 w-3" />
            Content
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-8 px-2 text-xs"
          >
            <Share2 className="mr-1 h-3 w-3" />
            Share
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(article.url, '_blank')}
            className="h-8 px-2 text-xs"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};