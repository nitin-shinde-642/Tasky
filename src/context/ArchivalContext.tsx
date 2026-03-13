import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';

interface ArchivalStats {
  archived: number;
  pending: number;
  date: string;
}

interface ArchivalContextType {
  lastArchiveDate: string | null;
  summaryStats: ArchivalStats | null;
}

const ArchivalContext = createContext<ArchivalContextType | undefined>(undefined);

export const ArchivalProvider = ({ children }: { children: ReactNode }) => {
  const [lastArchiveDate, setLastArchiveDate] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<ArchivalStats | null>(null);

  useEffect(() => {
    const checkArchival = async () => {
      try {
        const storedLastDate = (window.store ? await window.store.get('last_archive_date') : localStorage.getItem('last_archive_date')) as string | null;
        const today = format(new Date(), 'yyyy-MM-dd');
        
        if (!storedLastDate) {
          if (window.store) window.store.set('last_archive_date', today);
          else localStorage.setItem('last_archive_date', today);
          setLastArchiveDate(today);
          return;
        }

        setLastArchiveDate(storedLastDate);

        // Silent automatic archive based on system time date diff
        const [y, m, d] = storedLastDate.split('-').map(Number);
        const storedDateObj = new Date(y, m - 1, d);
        const daysDiff = differenceInCalendarDays(new Date(), storedDateObj);
        
        if (daysDiff > 0 && window.fsAPI?.archiveDay) {
          console.log(`[Archival] Triggering archive for ${storedLastDate} (Days diff: ${daysDiff})`);
          const res = await window.fsAPI.archiveDay(storedLastDate);
          
          if (res.success && res.stats) {
            const stats = res.stats;
            console.log(`[Archival] Success: ${stats.archived} archived, ${stats.pending} pending.`);
            setSummaryStats({ 
              archived: stats.archived, 
              pending: stats.pending, 
              date: storedLastDate 
            });
            
            // Only update last_archive_date on success
            if (window.store) window.store.set('last_archive_date', today);
            else localStorage.setItem('last_archive_date', today);
            setLastArchiveDate(today);
            
            // Silently reload to refresh task view
            window.location.reload(); 
          } else {
            console.error(`[Archival] Failed: ${res?.error}`);
          }
        } else if (daysDiff < 0) {
          console.warn(`[Archival] Future date detected (${storedLastDate}). Resetting to ${today}.`);
          // Reset to today to prevent skipping archives indefinitely
          if (window.store) window.store.set('last_archive_date', today);
          else localStorage.setItem('last_archive_date', today);
          setLastArchiveDate(today);
        }
      } catch (err) {
        console.error("Archival check failed", err);
      }
    };

    checkArchival();
    
    // Check every minute for midnight rollover
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        checkArchival();
      }
    }, 60000); 
    
    return () => clearInterval(interval);
  }, []);

  return (
    <ArchivalContext.Provider
      value={{
        lastArchiveDate,
        summaryStats
      }}
    >
      {children}
    </ArchivalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useArchival = () => {
  const context = useContext(ArchivalContext);
  if (context === undefined) {
    throw new Error('useArchival must be used within an ArchivalProvider');
  }
  return context;
};
