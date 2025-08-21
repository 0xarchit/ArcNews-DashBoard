import { useEffect, useState } from 'react';
import { RefreshCw, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { fetchLastUpdate } from '@/utils/api';
import { clearCache, clearExpiredCache } from '@/utils/cache';
import { formatRelativeTime } from '@/utils/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface NewsHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export const NewsHeader = ({ onRefresh, isLoading }: NewsHeaderProps) => {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadLastUpdate = async () => {
      try {
        const result = await fetchLastUpdate();
        if (result?.last_refresh) {
          setLastUpdate(result.last_refresh);
        }
      } catch (error) {
        console.warn('Failed to load last update:', error);
      }
    };

    loadLastUpdate();
    
    // Clean up expired cache on mount
    clearExpiredCache();
  }, []);

  const handleClearCache = () => {
    clearCache();
    toast({
      title: "Cache cleared",
      description: "All cached news data has been removed.",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ArcNews
            </h1>
            {lastUpdate && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span>Updated {formatRelativeTime(lastUpdate)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{profile?.username || 'Profile'}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="hidden sm:flex"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Cache
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Force Refresh</span>
            </Button>
            
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};