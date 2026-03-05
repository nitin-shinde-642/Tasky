import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface FolderContextType {
  folders: string[];
  activeFolder: string | null;
  sidebarOpen: boolean;
  baseDir: string;
  setActiveFolder: (folder: string) => void;
  createFolder: (name: string) => Promise<{ success: boolean; error?: string }>;
  toggleSidebar: () => void;
  refreshFolders: () => Promise<void>;
  updateBaseDir: (newDir: string) => Promise<boolean>;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderProvider = ({ children }: { children: ReactNode }) => {
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolderState] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [baseDir, setBaseDir] = useState('');

  const refreshFolders = async () => {
    if (window.fsAPI) {
      const dir = await window.fsAPI.getBaseDir();
      setBaseDir(dir);
      const list = await window.fsAPI.listFolders();
      setFolders(list);
      
      // Select first folder if none active
      if (list.length > 0) {
        if (!activeFolder || !list.includes(activeFolder)) {
          setActiveFolderState(list[0]);
        }
      } else {
        setActiveFolderState(null);
      }
    }
  };

  useEffect(() => {
    refreshFolders();
  }, []);

  const setActiveFolder = (folder: string) => {
    setActiveFolderState(folder);
    setSidebarOpen(false); // Auto close sidebar on mobile/small screens mostly, or just interaction preference
  };

  const createFolder = async (name: string) => {
    if (!window.fsAPI) return { success: false, error: 'File system not accessible' };
    
    // Trim and validation done in UI, but safe catch here
    const cleanName = name.trim();
    if (!cleanName) return { success: false, error: 'Folder name cannot be empty' };
    
    const res = await window.fsAPI.createFolder(cleanName);
    if (res.success) {
      await refreshFolders();
      setActiveFolderState(cleanName);
    }
    return res;
  };

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const updateBaseDir = async (newDir: string) => {
    if (!window.fsAPI) return false;
    const success = await window.fsAPI.setBaseDir(newDir);
    if (success) {
      await refreshFolders();
    }
    return success;
  };

  return (
    <FolderContext.Provider
      value={{
        folders,
        activeFolder,
        sidebarOpen,
        baseDir,
        setActiveFolder,
        createFolder,
        toggleSidebar,
        refreshFolders,
        updateBaseDir
      }}
    >
      {children}
    </FolderContext.Provider>
  );
};

export const useFolders = () => {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error('useFolders must be used within a FolderProvider');
  }
  return context;
};
