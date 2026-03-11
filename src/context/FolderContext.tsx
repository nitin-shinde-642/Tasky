import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  deleteFolder: (folderName: string, targetFolder?: string) => Promise<{ success: boolean; error?: string }>;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderProvider = ({ children }: { children: ReactNode }) => {
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolderState] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [baseDir, setBaseDir] = useState('');

  const refreshFolders = useCallback(async () => {
    if (window.fsAPI) {
      const dir = await window.fsAPI.getBaseDir();
      setBaseDir(dir);
      const list = await window.fsAPI.listFolders();
      setFolders(list);
      
      // Select first folder if none active
      setActiveFolderState(prev => {
        if (list.length > 0) {
          if (!prev || !list.includes(prev)) {
            return list[0];
          }
          return prev;
        }
        return null;
      });
    }
  }, []);

  useEffect(() => {
    refreshFolders();
  }, []);

  const setActiveFolder = useCallback((folder: string) => {
    setActiveFolderState(folder);
    setSidebarOpen(false); // Auto close sidebar on mobile/small screens mostly, or just interaction preference
  }, []);

  const createFolder = useCallback(async (name: string) => {
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
  }, [refreshFolders]);

  const deleteFolder = useCallback(async (folderName: string, targetFolder?: string) => {
    if (!window.fsAPI) return { success: false, error: 'File system not accessible' };
    const res = await window.fsAPI.deleteFolder(folderName, targetFolder);
    if (res.success) {
      await refreshFolders();
      if (activeFolder === folderName) {
        // Active folder was deleted, the refreshFolders will auto-select the first available
      }
    }
    return res;
  }, [refreshFolders, activeFolder]);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const updateBaseDir = useCallback(async (newDir: string) => {
    if (!window.fsAPI) return false;
    const success = await window.fsAPI.setBaseDir(newDir);
    if (success) {
      await refreshFolders();
    }
    return success;
  }, [refreshFolders]);

  const value = useMemo(() => ({
    folders,
    activeFolder,
    sidebarOpen,
    baseDir,
    setActiveFolder,
    createFolder,
    toggleSidebar,
    refreshFolders,
    updateBaseDir,
    deleteFolder
  }), [
    folders,
    activeFolder,
    sidebarOpen,
    baseDir,
    setActiveFolder,
    createFolder,
    toggleSidebar,
    refreshFolders,
    updateBaseDir,
    deleteFolder
  ]);

  return (
    <FolderContext.Provider value={value}>
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
