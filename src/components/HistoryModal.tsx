import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { useFolders } from '@/context/FolderContext';
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import type { Task } from '@/types/task';

interface ArchivedLog {
  date: string;
  folder: string;
  stats: {
    completed: number;
    pending: number;
  };
  tasks: Task[];
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const { activeFolder } = useFolders();
  const [selectedDate, setSelectedDate] = useState<Date>(subDays(new Date(), 1));
  const [logData, setLogData] = useState<{ type: 'json' | 'markdown' | 'text', content: ArchivedLog | string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLog() {
      if (!isOpen || !activeFolder || !window.fsAPI?.readArchive) return;
      
      setLoading(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      try {
        const res = await window.fsAPI.readArchive(activeFolder, dateString);
        if (res.success && res.content) {
          if (res.type === 'json') {
            setLogData({ type: 'json', content: JSON.parse(res.content) });
          } else {
            setLogData({ type: res.type || 'text', content: res.content });
          }
        } else {
          setLogData(null);
        }
      } catch {
        setLogData(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLog();
  }, [isOpen, selectedDate, activeFolder]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!logData) {
      return (
        <div className="flex flex-col items-center justify-center py-28 text-center px-4 bg-muted/10 rounded-xl border border-dashed">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No archive found</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            There are no archived tasks for this date in the '{activeFolder}' folder.
          </p>
        </div>
      );
    }

    if (logData.type === 'json' && typeof logData.content !== 'string') {
      const { tasks } = logData.content;
      const completedTasks = tasks.filter((t: Task) => t.completed);
      const pendingTasks = tasks.filter((t: Task) => !t.completed);

      return (
        <div className="space-y-8">
          {completedTasks.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Completed ({completedTasks.length})
              </h4>
              <div className="space-y-3">
                {completedTasks.map((task: Task) => (
                  <div key={task.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30 opacity-70">
                    <div className="mt-0.5">
                       <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-through decoration-muted-foreground/50">{task.title}</p>
                      {task.description && (
                        <div 
                          className="mt-1 text-xs text-muted-foreground prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: task.description }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pendingTasks.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Carried Forward ({pendingTasks.length})
              </h4>
              <div className="space-y-3">
                {pendingTasks.map((task: Task) => (
                  <div key={task.id} className="flex gap-3 p-3 rounded-lg border bg-card/50">
                    <div className="mt-1 flex items-center justify-center w-4 h-4 rounded border border-muted-foreground/30" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.description && (
                        <div 
                          className="mt-1 text-xs text-muted-foreground prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: task.description }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      );
    }

    // Markdown or Text Fallback
    return (
      <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-muted-foreground bg-muted/30 p-5 rounded-lg border border-border/50 shadow-inner">
        {typeof logData.content === 'string' ? logData.content : JSON.stringify(logData.content, null, 2)}
      </pre>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden rounded-xl border bg-card shadow-2xl z-10"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2 truncate pr-4">
                <CalendarIcon className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate">History Log for '{activeFolder}'</span>
              </h2>
              <button onClick={onClose} className="shrink-0 flex items-center justify-center rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-colors border shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-auto border-r bg-muted/10 p-4 hidden md:block overflow-y-auto">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  captionLayout="dropdown"
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => isAfter(startOfDay(date), startOfDay(new Date()))}
                  className="rounded-md border shadow-sm bg-background"
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 overflow-y-auto bg-background/50 relative scrollbar-thin">
                <div className="mb-6 border-b pb-4">
                  <h3 className="text-2xl font-bold tracking-tight">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
                  <p className="text-muted-foreground mt-1">Archived task log</p>
                </div>

                {renderContent()}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
