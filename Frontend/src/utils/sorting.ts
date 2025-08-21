import { Article, SortOption } from '@/types/news';
import { isArticleLiked } from './storage';

export const sortArticles = (articles: Article[], sortBy: SortOption): Article[] => {
  const sorted = [...articles];
  
  switch (sortBy) {
    case 'likes-desc':
      return sorted.sort((a, b) => {
        // Prioritize locally liked articles
        const aLiked = isArticleLiked(a.id);
        const bLiked = isArticleLiked(b.id);
        if (aLiked && !bLiked) return -1;
        if (!aLiked && bLiked) return 1;
        // Then sort by server likes
        return b.likes - a.likes;
      });
      
    case 'likes-asc':
      return sorted.sort((a, b) => {
        const aLiked = isArticleLiked(a.id);
        const bLiked = isArticleLiked(b.id);
        if (aLiked && !bLiked) return 1;
        if (!aLiked && bLiked) return -1;
        return a.likes - b.likes;
      });
      
    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
    case 'oldest':
      return sorted.sort((a, b) => 
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
      
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
      
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
      
    default:
      return sorted;
  }
};

export const filterArticles = (articles: Article[], searchQuery: string): Article[] => {
  if (!searchQuery.trim()) return articles;
  
  const query = searchQuery.toLowerCase();
  return articles.filter(article => 
    article.title.toLowerCase().includes(query) ||
    article.description.toLowerCase().includes(query) ||
    article.source.toLowerCase().includes(query)
  );
};

export const getSortLabel = (sortBy: SortOption): string => {
  switch (sortBy) {
    case 'likes-desc': return 'Most Liked';
    case 'likes-asc': return 'Least Liked';
    case 'newest': return 'Newest';
    case 'oldest': return 'Oldest';
    case 'title-asc': return 'Title A→Z';
    case 'title-desc': return 'Title Z→A';
    default: return 'Sort';
  }
};