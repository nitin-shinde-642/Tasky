import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Task, FilterOption } from '../types/task';
import { useFolders } from './FolderContext';

interface TaskContextType {
  tasks: Task[];
  searchQuery: string;
  filterOption: FilterOption;
  addTask: (title: string, description?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  reorderTasks: (startIndex: number, endIndex: number) => void;
  setSearchQuery: (query: string) => void;
  setFilterOption: (filter: FilterOption) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('All');
  
  const { activeFolder } = useFolders();

  const getStorageKey = () => `tasklyn_${activeFolder || 'default'}_tasks`;

  // Load on mount and folder change
  useEffect(() => {
    async function loadTasks() {
      if (!activeFolder) {
        setTasks([]);
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

  const addTask = (title: string, description: string = '') => {
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
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTaskCompletion = (id: string) => {
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
  };

  const reorderTasks = (startIndex: number, endIndex: number) => {
    setTasks((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        searchQuery,
        filterOption,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        reorderTasks,
        setSearchQuery,
        setFilterOption,
      }}
    >
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
