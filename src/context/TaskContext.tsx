import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, FilterOption } from '../types/task';
import { useFolders } from './FolderContext';
import { toast } from 'sonner';

interface TaskContextType {
  tasks: Task[];
  searchQuery: string;
  filterOption: FilterOption;
  addTask: (title: string, description?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  clearCompletedTasks: () => void;
  moveTask: (id: string, targetFolder: string) => Promise<boolean>;
  toggleTaskCompletion: (id: string) => void;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  setSearchQuery: (query: string) => void;
  setFilterOption: (filter: FilterOption) => void;
  isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('All');
  const [isLoading, setIsLoading] = useState(true);
  
  const { activeFolder } = useFolders();

  const getStorageKey = () => `tasklyn_${activeFolder || 'default'}_tasks`;

  // Load on mount and folder change
  useEffect(() => {
    async function loadTasks() {
      setIsLoading(true);
      if (!activeFolder) {
        setTasks([]);
        setIsLoading(false);
        return;
      }
      try {
        if (window.store) {
          const stored = await window.store.get(getStorageKey());
          setTasks(stored || []);
        } else {
          // Fallback for browser dev
          const stored = localStorage.getItem(getStorageKey());
          setTasks(stored ? JSON.parse(stored) : []);
        }
      } catch (e) {
        console.error("Failed to load tasks", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadTasks();
  }, [activeFolder]);

  // Save on change
  useEffect(() => {
    if (!activeFolder) return;
    try {
      if (window.store) {
        window.store.set(getStorageKey(), tasks);
      } else {
        localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
      }
    } catch (e) {
      console.error("Failed to save tasks", e);
    }
  }, [tasks, activeFolder]);

  const addTask = useCallback((title: string, description: string = '') => {
    if (!title.trim()) return;
    
    const newTask: Task = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const taskIndex = prev.findIndex((t) => t.id === id);
      if (taskIndex === -1) return prev;
      
      const taskToDelete = prev[taskIndex];
      const newTasks = [...prev];
      newTasks.splice(taskIndex, 1);
      
      toast('Task deleted', {
        action: {
          label: 'Undo',
          onClick: () => {
            setTasks((current) => {
              const restored = [...current];
              restored.splice(taskIndex, 0, taskToDelete);
              return restored;
            });
          }
        }
      });
      
      return newTasks;
    });
  }, []);

  const clearCompletedTasks = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.completed));
    toast.success('Cleared completed tasks');
  }, []);

  const moveTask = useCallback(async (id: string, targetFolder: string) => {
    // Cannot move to the same folder
    if (targetFolder === activeFolder) return false;

    let success = false;
    setTasks((prev) => {
      const taskIndex = prev.findIndex((t) => t.id === id);
      if (taskIndex === -1) return prev;

      const taskToMove = prev[taskIndex];
      const newTasks = [...prev];
      newTasks.splice(taskIndex, 1);

      // Perform the move asynchronously in the background
      const moveAsync = async () => {
        try {
          const targetStorageKey = `tasklyn_${targetFolder}_tasks`;
          const stored = window.store ? await window.store.get(targetStorageKey) : JSON.parse(localStorage.getItem(targetStorageKey) || '[]');
          const targetTasks = Array.isArray(stored) ? stored : [];
          targetTasks.unshift(taskToMove); // Add to top of target folder
          
          if (window.store) {
            window.store.set(targetStorageKey, targetTasks);
          } else {
            localStorage.setItem(targetStorageKey, JSON.stringify(targetTasks));
          }
          
          toast.success(`Moved to ${targetFolder}`);
        } catch (e) {
          console.error("Failed to move task:", e);
          toast.error("Failed to move task");
        }
      };
      
      moveAsync();
      success = true;
      return newTasks;
    });
    
    return success;
  }, [activeFolder]);

  const toggleTaskCompletion = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isCompleting = !t.completed;
          return {
            ...t,
            completed: isCompleting,
            completedAt: isCompleting ? Date.now() : null,
          };
        }
        return t;
      })
    );
  }, []);

  const reorderTasks = useCallback((startIndex: number, endIndex: number) => {
    setTasks((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const value = useMemo(() => ({
    tasks,
    searchQuery,
    filterOption,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    clearCompletedTasks,
    moveTask,
    toggleTaskCompletion,
    reorderTasks,
    setSearchQuery,
    setFilterOption,
  }), [
    tasks, 
    searchQuery, 
    filterOption, 
    isLoading,
    addTask, 
    updateTask, 
    deleteTask, 
    clearCompletedTasks,
    moveTask,
    toggleTaskCompletion, 
    reorderTasks
  ]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
