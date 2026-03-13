import { useState, useEffect } from 'react';
// Removed framer-motion since this is now a standard view
import { X, Save, FolderOpen, Loader2, Settings, Power, Palette, Moon, Sun, Monitor, HardDriveDownload, HardDriveUpload } from 'lucide-react';
import { useFolders } from '@/context/FolderContext';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsView({ isOpen, onClose }: SettingsModalProps) {
  const { baseDir, updateBaseDir } = useFolders();
  const { theme, setTheme } = useTheme();
  const [newDir, setNewDir] = useState(baseDir);
  const [autoStart, setAutoStart] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (window.systemAPI?.getAutoStart) {
      window.systemAPI.getAutoStart().then(setAutoStart);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    
    // Save Auto-start preference natively
    if (window.systemAPI?.setAutoStart) {
      window.systemAPI.setAutoStart(autoStart);
    }

    if (!newDir.trim() || newDir === baseDir) {
      setStatus('success');
      setMessage('Settings saved successfully.');
      setTimeout(() => onClose(), 1000);
      return;
    }
    
    try {
      const success = await updateBaseDir(newDir.trim());
      if (success) {
        setStatus('success');
        setMessage('Base directory updated successfully. Folders migrated.');
        setTimeout(() => onClose(), 1500);
      } else {
        setStatus('error');
        setMessage('Failed to update base directory. Ensure the path is valid.');
      }
    } catch {
      setStatus('error');
      setMessage('An unexpected error occurred.');
    }
  };

  const handleExport = async () => {
    if (!window.fsAPI) return;
    const res = await window.fsAPI.exportData();
    if (res.success) {
      toast.success('Data exported successfully');
    } else if (!res.canceled) {
      toast.error(res.error || 'Failed to export data');
    }
  };

  const handleImport = async () => {
    if (!window.fsAPI) return;
    const res = await window.fsAPI.importData();
    if (res.success) {
      toast.success('Data imported successfully. Reloading...', { duration: 2000 });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (!res.canceled) {
      toast.error(res.error || 'Failed to import data');
    }
  };

  if (!isOpen) return null;

  return (
    <main className="flex-1 flex flex-col p-4 overflow-y-auto max-w-2xl mx-auto w-full">
      <div className="w-full h-full flex flex-col pt-4">
        <div className="flex items-center justify-between mb-8 pb-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Settings
          </h2>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-colors border shadow-sm bg-card">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8 flex-1">
          
          <div className="space-y-5">
            <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
              <Palette className="w-5 h-5 text-muted-foreground" />
              Appearance
            </h3>

            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Theme Mode</label>
              <div className="flex gap-2 max-w-sm">
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium capitalize border transition-all ${theme === t ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    {t === 'light' ? <Sun size={16} /> : t === 'dark' ? <Moon size={16} /> : <Monitor size={16} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-6 border-t">
            <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
              <FolderOpen className="w-5 h-5 text-muted-foreground" />
              System Setup
            </h3>

            {/* Auto Start Toggle */}
            <div className="flex flex-row items-center justify-between rounded-xl border p-4 shadow-sm bg-card max-w-md">
              <div className="space-y-1">
                <div className="text-base font-medium flex items-center gap-2 text-foreground">
                  <Power className="w-4 h-4 text-muted-foreground" />
                  Open on Startup
                </div>
                <div className="text-xs text-muted-foreground">
                  Launch TaskLyn silently in the system tray when Windows starts
                </div>
              </div>
              <div className="flex items-center">
                 <button
                  type="button"
                  onClick={() => setAutoStart(!autoStart)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${autoStart ? 'bg-primary' : 'bg-input'}`}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-background ring-0 transition-transform shadow-sm ${autoStart ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

          {/* Base Directory */}
          <div className="space-y-3 max-w-md">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              Base Directory
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={newDir}
                  onChange={(e) => setNewDir(e.target.value)}
                  placeholder="C:\Users\Admin\Documents\TaskLyn"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (window.fsAPI?.showOpenDialog) {
                    const selectedPath = await window.fsAPI.showOpenDialog();
                    if (selectedPath) {
                      setNewDir(selectedPath);
                      setMessage('');
                      setStatus('idle');
                    }
                  }
                }}
                className="inline-flex items-center justify-center rounded-md border border-input bg-card px-4 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors h-10 whitespace-nowrap"
                title="Browse folders"
              >
                Browse
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The physical folder on your PC where all Tasks are stored. Changing this will automatically migrate existing folders.
            </p>
          </div>

          </div>

            {/* Data Management Section */}
            <div className="pt-2">
              <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                <HardDriveDownload className="w-5 h-5 text-muted-foreground" />
                Data Management
              </h3>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <HardDriveDownload size={16} className="text-muted-foreground" /> Export Data
                    </span>
                    <span className="text-xs text-muted-foreground max-w-[200px]">Create a backup of all tasks and settings</span>
                  </div>
                  <button 
                    type="button"
                    onClick={handleExport}
                    className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors shadow-sm"
                  >
                    Export...
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <HardDriveUpload size={16} className="text-muted-foreground" /> Import Data
                    </span>
                    <span className="text-xs text-muted-foreground max-w-[200px]">Restore from a previous backup file</span>
                  </div>
                  <button 
                    type="button"
                    onClick={handleImport}
                    className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors shadow-sm"
                  >
                    Import...
                  </button>
                </div>
              </div>
            </div>

          {message && (
            <div className={`p-3 rounded-lg border text-sm font-medium max-w-md ${status === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-start pt-6 border-t pb-8">
            <button
              type="submit"
              disabled={status === 'saving'}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 py-2"
            >
              {status === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
