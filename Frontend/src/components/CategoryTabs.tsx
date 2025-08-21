import { NewsCategory } from '@/types/news';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Clapperboard, 
  Heart, 
  Microscope, 
  Trophy, 
  Laptop,
  Globe
} from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: NewsCategory;
  onCategoryChange: (category: NewsCategory) => void;
}

const categories: { value: NewsCategory; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'all', label: 'All News', icon: Globe },
  { value: 'business', label: 'Business', icon: Briefcase },
  { value: 'entertainment', label: 'Entertainment', icon: Clapperboard },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'science', label: 'Science', icon: Microscope },
  { value: 'sports', label: 'Sports', icon: Trophy },
  { value: 'technology', label: 'Technology', icon: Laptop },
];

export const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  return (
    <div className="border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {categories.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={activeCategory === value ? "default" : "ghost"}
              size="sm"
              onClick={() => onCategoryChange(value)}
              className={`
                flex items-center gap-2 whitespace-nowrap transition-all duration-200
                ${activeCategory === value 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-secondary/80'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};