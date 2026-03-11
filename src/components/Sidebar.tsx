import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderPlus, X, Check, Trash2, AlertCircle } from 'lucide-react';
import { useFolders } from '@/context/FolderContext';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { folders, activeFolder, sidebarOpen, toggleSidebar, setActiveFolder, createFolder, deleteFolder } = useFolders();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState('');
  
  // Deletion state
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [deleteOption, setDeleteOption] = useState<'delete' | 'move'>('delete');
  const [targetMoveFolder, setTargetMoveFolder] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    const res = await createFolder(newFolderName);
    if (res.success) {
      setIsCreating(false);
      setNewFolderName('');
      setError('');
    } else {
      setError(res.error || 'Failed to create folder');
    }
  };

  const initiateDelete = async (folder: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if empty via store tasks check
    try {
      const tasks = await window.store.get(`tasklyn_${folder}_tasks`) || [];
      if (tasks.length === 0) {
        // Delete instantly
        await deleteFolder(folder);
      } else {
        // Prompt user
        setFolderToDelete(folder);
        // default move target to the first available other folder
        const otherFolders = folders.filter(f => f !== folder);
        setTargetMoveFolder(otherFolders.length > 0 ? otherFolders[0] : '');
      }
    } catch {
      await deleteFolder(folder); // Fallback
    }
  };

  const confirmDelete = async () => {
    if (!folderToDelete) return;
    setIsDeleting(true);
    await deleteFolder(folderToDelete, deleteOption === 'move' ? targetMoveFolder : undefined);
    setIsDeleting(false);
    setFolderToDelete(null);
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border shadow-2xl z-50 flex flex-col pt-10"
            >
              <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Folder className="text-primary" size={20} />
                  Folders
                </h2>
                <button 
                  onClick={toggleSidebar}
                  className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
                {folders.length === 0 && !isCreating && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Folder className="w-8 h-8 opacity-20" />
                    <p className="text-xs">No folders found.</p>
                  </div>
                )}
                {folders.map(folder => (
                  <div key={folder} className="relative group">
                    <button
                      onClick={() => setActiveFolder(folder)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        activeFolder === folder 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Folder size={16} className={cn(
                        activeFolder === folder ? "fill-primary-foreground/20" : "fill-muted"
                      )} />
                      <span className="truncate flex-1 text-left pr-6">{folder}</span>
                    </button>
                    
                    <button
                      onClick={(e) => initiateDelete(folder, e)}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-destructive/80 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all",
                        activeFolder === folder ? "text-primary-foreground opacity-100 hover:text-white hover:bg-black/20" : ""
                      )}
                      title="Delete folder"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {isCreating ? (
                  <form onSubmit={handleCreate} className="px-3 py-2 mt-2 bg-muted/50 rounded-lg border border-border">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => {
                        setNewFolderName(e.target.value);
                        setError('');
                      }}
                      className="w-full bg-background border rounded-md px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                    <div className="flex justify-end gap-1 mt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsCreating(false)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                      >
                        <X size={14} />
                      </button>
                      <button 
                        type="submit"
                        className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-lg text-sm font-medium border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <FolderPlus size={16} />
                    New Folder
                  </button>
                )}
              </div>
            </motion.div>
            
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
              {folderToDelete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                >
                  <div className="bg-card border shadow-2xl rounded-xl max-w-sm w-full p-6 space-y-4">
                    <div className="flex gap-3">
                      <div className="p-2 bg-destructive/10 text-destructive rounded-full shrink-0 h-fit">
                        <AlertCircle size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg leading-tight">Delete "{folderToDelete}"?</h3>
                        <p className="text-sm text-muted-foreground">
                          This folder contains active tasks. Do you want to permanently delete them or move them to another folder?
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                        <input 
                          type="radio" 
                          name="deleteOption" 
                          value="move" 
                          checked={deleteOption === 'move'} 
                          onChange={() => setDeleteOption('move')}
                          className="mt-1"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Move Tasks</span>
                          <span className="text-xs text-muted-foreground">Transfer tasks to another folder before deleting</span>
                        </div>
                      </label>
                      
                      {deleteOption === 'move' && folders.filter(f => f !== folderToDelete).length > 0 && (
                        <select 
                          value={targetMoveFolder}
                          onChange={(e) => setTargetMoveFolder(e.target.value)}
                          className="w-full ml-8 max-w-[calc(100%-2rem)] bg-background border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                          {folders.filter(f => f !== folderToDelete).map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      )}
                      
                      {deleteOption === 'move' && folders.filter(f => f !== folderToDelete).length === 0 && (
                         <p className="text-xs text-destructive ml-8">No other folders available to move tasks to.</p>
                      )}

                      <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer border-destructive/20 hover:bg-destructive/5 transition-colors">
                        <input 
                          type="radio" 
                          name="deleteOption" 
                          value="delete" 
                          checked={deleteOption === 'delete'} 
                          onChange={() => setDeleteOption('delete')}
                          className="mt-1 accent-destructive"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-destructive">Delete Everything</span>
                          <span className="text-xs text-destructive/80">Permanently delete the folder and all tasks</span>
                        </div>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <button
                        onClick={() => setFolderToDelete(null)}
                        className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground transition-colors"
                        disabled={isDeleting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDelete}
                        disabled={isDeleting || (deleteOption === 'move' && !targetMoveFolder)}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
