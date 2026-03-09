import { useState, useEffect } from 'react';
// Removed framer-motion since this is now a standard view
import { X, Save, FolderOpen, Loader2, Settings, Power, Palette, Moon, Sun, Monitor, Check } from 'lucide-react';
import { useFolders } from '@/context/FolderContext';
import { useTheme } from '@/components/ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsView({ isOpen, onClose }: SettingsModalProps) {
  const { baseDir, updateBaseDir } = useFolders();
  const { theme, setTheme, accent, setAccent, opacity, setOpacity } = useTheme();
  const [newDir, setNewDir] = useState(baseDir);
  const [autoStart, setAutoStart] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewDir(baseDir);
      setStatus('idle');
      setMessage('');
      if (window.systemAPI?.getAutoStart) {
        window.systemAPI.getAutoStart().then(setAutoStart);
      }
    }
  }, [isOpen, baseDir]);

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
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred.');
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

            {/* Accent Color Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Accent Color</label>
              <div className="flex flex-wrap gap-3">
                {(["zinc", "red", "rose", "orange", "green", "blue", "yellow", "violet"] as const).map((colorName) => (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setAccent(colorName)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-transform shadow-sm ${accent === colorName ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{
                      backgroundColor: 
                        colorName === 'zinc' ? '#3f3f46' :
                        colorName === 'red' ? '#ef4444' :
                        colorName === 'rose' ? '#f43f5e' :
                        colorName === 'orange' ? '#f97316' :
                        colorName === 'green' ? '#22c55e' :
                        colorName === 'blue' ? '#3b82f6' :
                        colorName === 'yellow' ? '#eab308' :
                        '#8b5cf6'
                    }}
                  >
                     {accent === colorName && <Check size={16} className="text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Window Transparency Slider */}
            <div className="space-y-3 pt-4 border-t border-border/50 max-w-sm">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-muted-foreground">Window Transparency</label>
                <span className="text-sm text-foreground bg-muted px-2 py-0.5 rounded-md font-mono border">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
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
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${autoStart ? 'bg-primary' : 'bg-input'}`}
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
