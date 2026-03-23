import { TitleBar } from '@/components/TitleBar';
import { TaskProvider, useTasks } from '@/context/TaskContext';
import { FolderProvider } from '@/context/FolderContext';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { TaskList } from '@/components/TaskList';
import { Sidebar } from '@/components/Sidebar';
import { SettingsView } from '@/components/SettingsModal';
import { HistoryModal } from '@/components/HistoryModal';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ArchivalProvider, useArchival } from '@/context/ArchivalContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'sonner';
import { RichTextEditor } from '@/components/RichTextEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { DailySummaryModal } from '@/components/SummaryModal';
import { UpdateProvider } from '@/context/UpdateContext';

function AppContent() {
  const { addTask } = useTasks();
  const { summaryStats } = useArchival();
  const [showSummary, setShowSummary] = useState(false);
  
  // Track if we've already shown the summary for the current stats to avoid re-triggering
  const [lastShownDate, setLastShownDate] = useState<string | null>(null);

  useEffect(() => {
    if (summaryStats && summaryStats.date !== lastShownDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSummary(true);
      setLastShownDate(summaryStats.date);
    }
  }, [summaryStats, lastShownDate]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle, newTaskDesc);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTagName = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTagName === 'input' || activeTagName === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.ctrlKey) {
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          document.getElementById('new-task-title')?.focus();
        }
      } else if (!isInputFocused && !e.metaKey && !e.altKey && e.key.length === 1) {
        // If the user starts typing anywhere else in the app, immediately focus the Add Task input
        // so the typed character drops directly into it natively.
        document.getElementById('new-task-title')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <TitleBar onSettingsClick={() => setIsSettingsOpen(true)} />
      <Sidebar />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      
      {showSummary && (
        <DailySummaryModal 
          stats={summaryStats} 
          onClose={() => setShowSummary(false)} 
        />
      )}
      
      {isSettingsOpen ? (
        <SettingsView isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      ) : (
        <main className="flex-1 flex flex-col p-4 overflow-hidden max-w-lg mx-auto w-full relative">
        <div className="mb-2 w-full">
          <SearchFilterBar onHistoryClick={() => setIsHistoryOpen(true)} />
        </div>
        <TaskList />
        
        {/* Add Task Form Fixed at bottom */}
        <form 
          onSubmit={handleAddTask} 
          className="absolute bottom-4 left-4 right-4 bg-card rounded-xl border shadow-lg p-2 flex flex-col gap-2 z-20"
        >
          <div className="flex items-center gap-2">
            <input
              id="new-task-title"
              type="text"
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 px-2 text-sm outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="bg-primary text-primary-foreground p-1.5 rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          <AnimatePresence>
            {newTaskTitle.trim() && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-full px-1 overflow-hidden"
              >
                <div className="pt-1 pb-1">
                  <RichTextEditor
                     content={newTaskDesc}
                     onChange={setNewTaskDesc}
                     onSubmit={handleAddTask}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </main>
      )}
    </div>
  );
}


function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tasklyn-theme">
      <FolderProvider>
        <TaskProvider>
          <ArchivalProvider>
            <UpdateProvider>
              <AppContent />
              <Toaster position="bottom-right" />
            </UpdateProvider>
          </ArchivalProvider>
        </TaskProvider>
      </FolderProvider>
    </ThemeProvider>
  );
}

export default App;
