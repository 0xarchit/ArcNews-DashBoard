import { Search, SortAsc, Grid3X3, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SortOption, ViewMode } from '@/types/news';
import { getSortLabel } from '@/utils/sorting';

interface ControlBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalResults: number;
  filteredResults: number;
}

const sortOptions: SortOption[] = [
  'likes-desc',
  'likes-asc', 
  'newest',
  'oldest',
  'title-asc',
  'title-desc'
];

export const ControlBar = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
  filteredResults
}: ControlBarProps) => {
  return (
    <div className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search and results */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            <div className="relative min-w-0 flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {searchQuery ? (
                <span>
                  {filteredResults} of {totalResults} articles
                  {filteredResults !== totalResults && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onSearchChange('')}
                      className="ml-2 h-auto p-0 text-xs underline"
                    >
                      Clear
                    </Button>
                  )}
                </span>
              ) : (
                <span>{totalResults} articles</span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
              <SelectTrigger className="w-[140px]">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {getSortLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="rounded-r-none border-r"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};