import { useEffect, useState } from 'react';
import { X, ExternalLink, Loader2, FileText, Eye, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Article, NewsCategory } from '@/types/news';
import { fetchArticleSummary } from '@/utils/api';
import { formatExactDate, getHostname } from '@/utils/dateUtils';
import { getRandomQuote } from '@/utils/waitingQuotes';
import { useToast } from '@/hooks/use-toast';

interface ArticleModalProps {
  article: Article | null;
  category: NewsCategory;
  mode: 'summary' | 'content' | null;
  onClose: () => void;
}

export const ArticleModal = ({ article, category, mode, onClose }: ArticleModalProps) => {
  const [loading, setLoading] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitingQuote, setWaitingQuote] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'content'>('summary');
  const { toast } = useToast();

  useEffect(() => {
    if (!article || !mode) {
      setCurrentArticle(null);
      setError(null);
      return;
    }

    setCurrentArticle(article);
    setError(null);
    setActiveTab(mode);

    // Check if we need to fetch data
    const needsFetch = mode === 'summary' 
      ? !article.summary 
      : !article.content;

    if (needsFetch) {
      fetchData(mode);
    }
  }, [article, mode]);

  const handleTabChange = (newTab: 'summary' | 'content') => {
    setActiveTab(newTab);
    setError(null);

    if (!currentArticle) return;

    // Check if we need to fetch data for the new tab
    const needsFetch = newTab === 'summary' 
      ? !currentArticle.summary 
      : !currentArticle.content;

    if (needsFetch) {
      fetchData(newTab);
    }
  };

  const fetchData = async (targetMode?: 'summary' | 'content') => {
    if (!article) return;

    setLoading(true);
    setError(null);
    setWaitingQuote(getRandomQuote());

    try {
      // Use article's category instead of the passed category to avoid using "all"
      const articleCategory = article.category || category;
      const updatedArticle = await fetchArticleSummary(articleCategory, article.id);
      setCurrentArticle(updatedArticle);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load article data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchData();
  };

  if (!article || !mode) {
    return null;
  }

  return (
    <Dialog open={!!article && !!mode} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold pr-8">
            Article Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Article header */}
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-semibold leading-tight mb-2">
              {article.title}
            </h2>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="font-medium">{getHostname(article.url)}</span>
                <span>{formatExactDate(article.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/dashboard?category=${category}&id=${article.id}`;
                    navigator.clipboard.writeText(shareUrl);
                    toast({
                      title: "Link copied!",
                      description: "Article link has been copied to clipboard.",
                    });
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Read Original
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs for Summary/Content */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Full Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-y-auto mt-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-lg font-medium text-center">{waitingQuote}</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Generating summary...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-destructive mb-2">
                      Failed to load summary
                    </h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={handleRetry} variant="outline">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : currentArticle?.summary ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {currentArticle.summary}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <p className="text-muted-foreground text-center">
                    No summary available for this article.
                  </p>
                  <Button onClick={handleRetry} variant="outline">
                    Try to Generate
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="content" className="flex-1 overflow-y-auto mt-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-lg font-medium text-center">{waitingQuote}</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Loading full content...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-destructive mb-2">
                      Failed to load content
                    </h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={handleRetry} variant="outline">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : currentArticle?.content ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {currentArticle.content}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <p className="text-muted-foreground text-center">
                    No content available for this article.
                  </p>
                  <Button onClick={handleRetry} variant="outline">
                    Try to Generate
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};