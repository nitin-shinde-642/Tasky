import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UpdateContextType {
  updateStatus: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  progress: number;
  checkForUpdates: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [updateStatus, setUpdateStatus] = useState<UpdateContextType['updateStatus']>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!window.systemAPI) return;

    if (window.systemAPI.onUpdateAvailable) {
      window.systemAPI.onUpdateAvailable(() => {
        setUpdateStatus('available');
        toast.info('New update available. Downloading...', { duration: 5000 });
      });
    }

    if (window.systemAPI.onUpdateProgress) {
      window.systemAPI.onUpdateProgress((prog: { percent: number }) => {
        setUpdateStatus('downloading');
        setProgress(prog.percent || 0);
      });
    }

    if (window.systemAPI.onUpdateDownloaded) {
      window.systemAPI.onUpdateDownloaded(() => {
        setUpdateStatus('downloaded');
        setProgress(100);
        toast.success('Update ready! Restarting automatically...', { duration: 5000 });
      });
    }
  }, []);

  const checkForUpdates = async () => {
    if (!window.systemAPI?.checkForUpdates) return;
    if (updateStatus === 'checking' || updateStatus === 'downloading') return;
    
    setUpdateStatus('checking');
    try {
      const result = await window.systemAPI.checkForUpdates();
      if (result && result.error) {
        toast.error(result.error);
        setUpdateStatus('idle');
      } else if (!result || !result.updateInfo || result.updateInfo.version === await window.systemAPI.getAppVersion()) {
        toast.info('You are already on the latest version.');
        setUpdateStatus('idle');
      }
    } catch (err) {
      console.error('Manual check failed', err);
      toast.error('Failed to check for updates. Make sure you are online.');
      setUpdateStatus('error');
    }
  };

  return (
    <UpdateContext.Provider value={{ updateStatus, progress, checkForUpdates }}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdateInfo() {
  const context = useContext(UpdateContext);
  if (context === undefined) {
    throw new Error('useUpdateInfo must be used within an UpdateProvider');
  }
  return context;
}
