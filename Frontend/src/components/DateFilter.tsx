import { DateFilter as DateFilterType } from '@/types/news';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateFilterProps {
  activeFilter: DateFilterType | null;
  onFilterChange: (filter: DateFilterType | null) => void;
}

const dateFilters: { value: DateFilterType; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '3-days-ago', label: '3 Days Ago' },
  { value: '5-days-ago', label: '5 Days Ago' },
];

export const DateFilter = ({ activeFilter, onFilterChange }: DateFilterProps) => {
  const getActiveLabel = () => {
    if (!activeFilter) return 'All Time';
    return dateFilters.find(f => f.value === activeFilter)?.label || 'All Time';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 bg-background border-border"
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{getActiveLabel()}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40 bg-background border-border shadow-md"
      >
        <DropdownMenuItem
          onClick={() => onFilterChange(null)}
          className={`cursor-pointer ${!activeFilter ? 'bg-accent' : ''}`}
        >
          All Time
        </DropdownMenuItem>
        {dateFilters.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => onFilterChange(value)}
            className={`cursor-pointer ${activeFilter === value ? 'bg-accent' : ''}`}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};