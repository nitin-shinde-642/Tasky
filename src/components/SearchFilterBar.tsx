import { useTasks } from '@/context/TaskContext';
import { Search } from 'lucide-react';
import type { FilterOption } from '@/types/task';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { History, Eraser } from 'lucide-react';

const FILTERS: FilterOption[] = ['All', 'Pending', 'Completed'];

export function SearchFilterBar({ onHistoryClick }: { onHistoryClick?: () => void }) {
  const { tasks, searchQuery, setSearchQuery, filterOption, setFilterOption, clearCompletedTasks } = useTasks();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  return (
    <div className="flex flex-col gap-3 w-full sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b border-border/40 pb-4 mb-2">
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-2">
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
        
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {tasks.some(t => t.completed) && filterOption === 'All' && (
            <button 
              onClick={clearCompletedTasks}
              className="p-1.5 hover:bg-destructive/10 text-destructive/80 hover:text-destructive rounded-md border border-transparent hover:border-destructive/20 transition-all shadow-sm"
              title="Clear Completed Tasks"
            >
              <Eraser size={16} />
            </button>
          )}
          
          {onHistoryClick && (
            <button 
              onClick={onHistoryClick}
              className="p-1.5 hover:bg-muted text-muted-foreground rounded-md border shadow-sm transition-colors"
              title="View History"
            >
              <History size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="relative w-full group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          id="search-input"
          type="text"
          placeholder="Search tasks..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border bg-muted/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground text-sm"
        />
      </div>
    </div>
  );
}
