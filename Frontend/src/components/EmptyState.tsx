import { Search, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'no-articles' | 'no-results' | 'error';
  searchQuery?: string;
  onClearSearch?: () => void;
  onRetry?: () => void;
}

export const EmptyState = ({ type, searchQuery, onClearSearch, onRetry }: EmptyStateProps) => {
  if (type === 'no-results' && searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No articles found</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          No articles match your search for "{searchQuery}". Try different keywords or browse all articles.
        </p>
        {onClearSearch && (
          <Button onClick={onClearSearch} variant="outline">
            Clear Search
          </Button>
        )}
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Newspaper className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Failed to load articles</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          We couldn't fetch the latest news. Please check your connection and try again.
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Newspaper className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No articles available</h3>
      <p className="text-muted-foreground max-w-md">
        There are no articles available in this category at the moment. Please try again later.
      </p>
    </div>
  );
};