import { useTasks } from '@/context/TaskContext';
import { Search } from 'lucide-react';
import type { FilterOption } from '@/types/task';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const FILTERS: FilterOption[] = ['All', 'Pending', 'Completed'];

export function SearchFilterBar() {
  const { searchQuery, setSearchQuery, filterOption, setFilterOption } = useTasks();

  return (
    <div className="flex flex-col gap-3 w-full sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b border-border/40 pb-4 mb-2">
      <div className="flex gap-2 w-full">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterOption(filter)}
            className={cn(
              "relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
              filterOption === filter 
                ? "text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {filterOption === filter && (
              <motion.div
                layoutId="active-filter"
                className="absolute inset-0 bg-primary rounded-full -z-10"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            {filter}
          </button>
        ))}
      </div>

      <div className="relative w-full group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border bg-muted/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground text-sm"
        />
      </div>
    </div>
  );
}
