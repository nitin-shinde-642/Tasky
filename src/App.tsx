import { TitleBar } from '@/components/TitleBar';
import { TaskProvider, useTasks } from '@/context/TaskContext';
import { FolderProvider } from '@/context/FolderContext';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { TaskList } from '@/components/TaskList';
import { Sidebar } from '@/components/Sidebar';
import { SettingsView } from '@/components/SettingsModal';
import { HistoryModal } from '@/components/HistoryModal';
import { Plus, History } from 'lucide-react';
import { useState } from 'react';
import { ArchivalProvider } from '@/context/ArchivalContext';
import { ThemeProvider } from '@/components/ThemeProvider';

function AppContent() {
  const { addTask } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle, newTaskDesc);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <TitleBar onSettingsClick={() => setIsSettingsOpen(true)} />
      <Sidebar />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      
      {isSettingsOpen ? (
        <SettingsView isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      ) : (
        <main className="flex-1 flex flex-col p-4 overflow-hidden max-w-lg mx-auto w-full relative">
        <div className="flex items-center justify-between mb-2">
          <SearchFilterBar />
          <div className="flex gap-1 ml-2">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 hover:bg-muted text-muted-foreground rounded-lg border shadow-sm transition-colors"
              title="View History"
            >
              <History size={16} />
            </button>
          </div>
        </div>
        <TaskList />
        
        {/* Add Task Form Fixed at bottom */}
        <form 
          onSubmit={handleAddTask} 
          className="absolute bottom-4 left-4 right-4 bg-card rounded-xl border shadow-lg p-2 flex flex-col gap-2 z-20"
        >
          <div className="flex items-center gap-2">
            <input
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
          {newTaskTitle.trim() && (
            <input
              type="text"
              placeholder="Description (optional)"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 px-2 text-xs text-muted-foreground outline-none"
            />
          )}
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
            <AppContent />
          </ArchivalProvider>
        </TaskProvider>
      </FolderProvider>
    </ThemeProvider>
  );
}

export default App;
