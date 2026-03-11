import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, AlignLeft, Trash2, Edit2, Check } from 'lucide-react';
import type { Task } from '@/types/task';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/RichTextEditor';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Copy, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

export function TaskDetailsModal({ task, isOpen, onClose, onDelete, onToggle, onUpdate }: TaskDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [contextLink, setContextLink] = useState<{ url: string, text: string } | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description || '');
    }
    // Reset editing state when modal opens/closes or task changes
    setIsEditing(false);
  }, [task, isOpen]);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (task && editTitle.trim() && onUpdate) {
      onUpdate(task.id, { title: editTitle.trim(), description: editDesc.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description || '');
    }
    setIsEditing(false);
  };
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && task && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-xl border bg-card shadow-2xl z-10"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div className="flex items-start gap-3 w-full max-w-[calc(100%-2rem)] min-w-0">
                {onToggle && (
                   <Checkbox
                     checked={task.completed}
                     onCheckedChange={() => onToggle(task.id)}
                     className="mt-1 shrink-0"
                   />
                )}
                <h2 className="text-lg font-semibold flex items-start text-foreground w-full min-w-0">
                  <span className={cn("break-words break-all leading-tight w-full", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="shrink-0 flex items-center justify-center rounded-md p-1.5 hover:bg-muted text-muted-foreground transition-colors border shadow-sm bg-background"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto p-5 custom-scrollbar bg-background">
              
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground mb-6 border-b pb-4">
                 <div className="flex flex-wrap items-center gap-3 flex-1">
                   <div className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-md border text-xs">
                      <CalendarIcon size={14} className="text-primary/70" />
                      <span>Created: {format(task.createdAt, 'MMM d, yyyy - h:mm a')}</span>
                   </div>
                 {task.completedAt && (
                   <div className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-md border text-xs">
                      <CalendarIcon size={14} className="text-primary/70" />
                      <span>Completed: {format(task.completedAt, 'MMM d, yyyy - h:mm a')}</span>
                   </div>
                 )}
                 </div>
                 
                 <div className="flex items-center gap-1 shrink-0">
                   {!task.completed && onUpdate && !isEditing && (
                     <button
                       onClick={() => setIsEditing(true)}
                       className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors border shadow-sm"
                       title="Edit details"
                     >
                       <Edit2 size={15} />
                     </button>
                   )}
                   {onDelete && (
                     <button
                       onClick={() => {
                         onDelete(task.id);
                         onClose();
                       }}
                       className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors border shadow-sm"
                       title="Delete task"
                     >
                       <Trash2 size={15} />
                     </button>
                   )}
                 </div>
              </div>

              {isEditing ? (
                 <div className="flex flex-col gap-4 animate-in fade-in duration-200 pb-2">
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-muted-foreground ml-1">Title</label>
                     <input
                       ref={titleInputRef}
                       type="text"
                       value={editTitle}
                       onChange={(e) => setEditTitle(e.target.value)}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') handleSave();
                         if (e.key === 'Escape') handleCancel();
                       }}
                       className="w-full bg-background border px-3 py-2 text-sm rounded-md focus:ring-1 focus:ring-primary outline-none"
                       placeholder="Task title"
                     />
                   </div>
                   
                   <div className="space-y-1">
                     <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-2">
                       <AlignLeft size={14} /> Description
                     </label>
                     <RichTextEditor
                       content={editDesc || ''}
                       onChange={setEditDesc}
                     />
                   </div>

                   <div className="flex justify-end gap-2 mt-2 pt-4 border-t">
                      <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors">
                        <X size={14} /> Cancel
                      </button>
                      <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                        <Check size={14} /> Save Changes
                      </button>
                   </div>
                 </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlignLeft size={16} className="text-muted-foreground" />
                    <h3>Description</h3>
                  </div>

                  {task.description ? (
                    <ContextMenu.Root onOpenChange={(open) => { if (!open) setContextLink(null) }}>
                      <ContextMenu.Trigger 
                        asChild
                        onContextMenu={(e: any) => {
                          const target = e.target as HTMLElement;
                          const link = target.closest?.('a');
                          if (link) {
                            setContextLink({ url: link.href, text: link.innerText || link.textContent || '' });
                          } else {
                            setContextLink(null);
                          }
                        }}
                      >
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 break-words leading-relaxed pl-6 mt-2 pb-4 [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0"
                          dangerouslySetInnerHTML={{ __html: task.description }}
                        />
                      </ContextMenu.Trigger>
                      <ContextMenu.Content className="min-w-[160px] bg-popover text-popover-foreground shadow-md rounded-md border p-1 z-[250] animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
                        {contextLink ? (
                          <>
                            <ContextMenu.Item 
                              onSelect={() => navigator.clipboard.writeText(contextLink.url)}
                              className="flex items-center px-2 py-1.5 text-sm outline-none cursor-pointer rounded hover:bg-muted transition-colors"
                            >
                              <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
                            </ContextMenu.Item>
                            <ContextMenu.Item 
                              onSelect={() => navigator.clipboard.writeText(contextLink.text)}
                              className="flex items-center px-2 py-1.5 text-sm outline-none cursor-pointer rounded hover:bg-muted transition-colors"
                            >
                              <Copy className="mr-2 h-4 w-4" /> Copy Text
                            </ContextMenu.Item>
                            <ContextMenu.Item 
                              onSelect={() => window.systemAPI.openExternal(contextLink.url)}
                              className="flex items-center px-2 py-1.5 text-sm outline-none cursor-pointer rounded hover:bg-muted transition-colors mt-1 border-t rounded-t-none"
                            >
                               <ExternalLink className="mr-2 h-4 w-4" /> Open in Browser
                            </ContextMenu.Item>
                          </>
                        ) : (
                          <ContextMenu.Item 
                            onSelect={() => navigator.clipboard.writeText(task.description || '')}
                            className="flex items-center px-2 py-1.5 text-sm outline-none cursor-pointer rounded hover:bg-muted transition-colors"
                          >
                            <Copy className="mr-2 h-4 w-4" /> Copy Description
                          </ContextMenu.Item>
                        )}
                      </ContextMenu.Content>
                    </ContextMenu.Root>
                  ) : (
                    <div className="pl-6 mt-2 text-sm text-muted-foreground italic pb-4">
                      No description provided.
                    </div>
                  )}
                </>
              )}

            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
