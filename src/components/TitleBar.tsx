import { useState } from 'react';
import { Minus, Square, X, Pin, Settings as SettingsIcon, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFolders } from '@/context/FolderContext';

interface TitleBarProps {
  onSettingsClick?: () => void;
}

export function TitleBar({ onSettingsClick }: TitleBarProps) {
  const [isPinned, setIsPinned] = useState(false);
  const { toggleSidebar } = useFolders();

  const handlePin = () => {
    const newState = !isPinned;
    setIsPinned(newState);
    if (window.windowControls?.pin) {
      window.windowControls.pin(newState);
    }
  };

  const handleMinimize = () => {
    if (window.windowControls?.minimize) window.windowControls.minimize();
  };

  const handleMaximize = () => {
    if (window.windowControls?.maximize) window.windowControls.maximize();
  };

  const handleClose = () => {
    if (window.windowControls?.close) window.windowControls.close();
  };

  return (
    <div
      className="flex h-10 w-full items-center justify-between bg-background border-b border-border text-foreground select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center pl-2 gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-accent rounded-md text-muted-foreground transition-colors mr-1"
        >
          <Menu size={18} />
        </button>
        <span className="font-semibold text-sm" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>TaskLyn</span>
      </div>

      <div
        className="flex h-full items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handlePin}
          className={cn(
            "flex h-full items-center justify-center px-3 transition-colors",
            isPinned 
              ? "bg-primary/15 text-primary hover:bg-primary/25" 
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          title={isPinned ? "Unpin from top" : "Always on top"}
        >
          <Pin size={16} className={cn(isPinned && "fill-current")} />
        </button>
        <button
          onClick={onSettingsClick}
          className="flex h-full items-center justify-center px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Settings"
        >
          <SettingsIcon size={16} />
        </button>
        <button
          onClick={handleMinimize}
          className="flex h-full items-center justify-center px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-full items-center justify-center px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Square size={14} />
        </button>
        <button
          onClick={handleClose}
          className="flex h-full items-center justify-center px-3 hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
