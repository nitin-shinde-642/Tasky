import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderPlus, X, Check } from 'lucide-react';
import { useFolders } from '@/context/FolderContext';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { folders, activeFolder, sidebarOpen, toggleSidebar, setActiveFolder, createFolder } = useFolders();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState('');

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
                {folders.map(folder => (
                  <button
                    key={folder}
                    onClick={() => setActiveFolder(folder)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                      activeFolder === folder 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Folder size={16} className={cn(
                      activeFolder === folder ? "fill-primary-foreground/20" : "fill-muted group-hover:fill-muted-foreground/20"
                    )} />
                    <span className="truncate flex-1 text-left">{folder}</span>
                  </button>
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}
