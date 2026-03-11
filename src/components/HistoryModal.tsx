import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { useFolders } from '@/context/FolderContext';
import { format, subDays } from 'date-fns';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const { activeFolder } = useFolders();
  const [selectedDate, setSelectedDate] = useState<Date>(subDays(new Date(), 1));
  const [logContent, setLogContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLog() {
      if (!isOpen || !activeFolder || !window.fsAPI?.readArchive) return;
      
      setLoading(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      try {
        const res = await window.fsAPI.readArchive(activeFolder, dateString);
        if (res.success && res.content) {
          setLogContent(res.content);
        } else {
          setLogContent(null);
        }
      } catch (e) {
        setLogContent(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLog();
  }, [isOpen, selectedDate, activeFolder]);

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
            className="relative w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden rounded-xl border bg-card shadow-2xl z-10"
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
              <div className="w-auto border-r bg-muted/10 p-4 hidden md:block">
                <input
                  type="date"
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(new Date(e.target.value));
                  }}
                  className="bg-background border rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary w-full shadow-sm"
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 overflow-y-auto bg-background/50 relative">
                {/* Mobile drop down for dates */}
                <div className="md:hidden justify-center flex mb-6">
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(new Date(e.target.value));
                    }}
                    className="bg-background border rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary w-full shadow-sm"
                  />
                </div>

                <div className="mb-6 border-b pb-4">
                  <h3 className="text-2xl font-bold tracking-tight">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
                  <p className="text-muted-foreground mt-1">Archived task log</p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : logContent ? (
                  <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-muted-foreground bg-muted/30 p-5 rounded-lg border border-border/50 shadow-inner">
                    {logContent}
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center py-28 text-center px-4 bg-muted/10 rounded-xl border border-dashed">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">No archive found</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      There are no archived tasks for this date in the '{activeFolder}' folder.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
