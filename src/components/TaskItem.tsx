import { useState, memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Edit2, Check, X, Eye, Copy, Link as LinkIcon, ExternalLink } from 'lucide-react';
import type { Task } from '@/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { useFolders } from '@/context/FolderContext';
import { RichTextEditor } from '@/components/RichTextEditor';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onMove?: (id: string, targetFolder: string) => void;
}

export const TaskItem = memo(function TaskItem({ task, index, onToggle, onDelete, onUpdate, onMove }: TaskItemProps) {
  const { folders, activeFolder } = useFolders();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [contextLink, setContextLink] = useState<{ url: string, text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (descRef.current) {
        const el = descRef.current;
        const isCurrentlyExpanded = !el.classList.contains('line-clamp-2');
        if (isCurrentlyExpanded) el.classList.add('line-clamp-2');
        
        const isOverflowing = el.scrollHeight > el.clientHeight;
        
        if (isCurrentlyExpanded) el.classList.remove('line-clamp-2');
        setShowSeeMore(isOverflowing);
      }
    };
    
    // Small delay to allow DOM to paint
    const timeoutId = setTimeout(checkOverflow, 10);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [task.description]);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim() && onUpdate) {
      onUpdate(task.id, { title: editTitle.trim(), description: editDesc.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setIsEditing(false);
  };

  return (
    <>
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <ContextMenu.Root onOpenChange={(open) => { if (!open) setContextLink(null) }}>
          <ContextMenu.Trigger 
            asChild
            onContextMenu={(e: React.MouseEvent) => {
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
              ref={provided.innerRef}
              {...provided.draggableProps}
              className={cn(
                "group relative flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-colors mb-2 select-none",
                snapshot.isDragging && "shadow-lg border-primary/50 z-50",
                task.completed && "opacity-60 bg-muted/50"
              )}
            >
          <div className="flex items-start gap-3">
            <div
              {...provided.dragHandleProps}
              className="mt-1 -ml-1 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
              title="Drag to reorder"
            >
              <GripVertical size={16} />
            </div>

            <div className="mt-1 h-5 w-5 flex items-center justify-center">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggle(task.id)}
              />
            </div>

            <div className="flex flex-1 flex-col justify-center min-w-0" onDoubleClick={() => !task.completed && setIsEditing(true)}>
              {isEditing ? (
                 <div className="space-y-2 w-full mt-1.5 pb-2">
                   <input
                     ref={titleInputRef}
                     type="text"
                     value={editTitle}
                     onChange={(e) => setEditTitle(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSave();
                       if (e.key === 'Escape') handleCancel();
                     }}
                     className="w-full bg-background border px-2 py-1 text-sm rounded-md focus:ring-1 focus:ring-primary outline-none"
                     placeholder="Task title"
                     />
                     <div className="flex gap-2 w-full mt-2">
                       <RichTextEditor
                         content={editDesc || ''}
                         onChange={setEditDesc}
                       />
                       <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={handleSave} className="p-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity" title="Save changes">
                          <Check size={14} />
                        </button>
                        <button onClick={handleCancel} className="p-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors" title="Cancel">
                          <X size={14} />
                        </button>
                     </div>
                   </div>
                 </div>
              ) : (
                <>
                  <div className="relative inline-block w-full">
                    <span
                      className={cn(
                        "block truncate font-medium text-sm transition-colors duration-200",
                        task.completed ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    
                    {/* Animated Strikethrough */}
                    <motion.div
                      initial={false}
                      animate={{
                        width: task.completed ? "100%" : "0%",
                        opacity: task.completed ? 1 : 0
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="absolute left-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-muted-foreground origin-left pointer-events-none"
                    />
                  </div>

                  {task.description && (
                    <div className="mt-1 flex flex-col items-start gap-1 w-full pl-0.5">
                      <div
                        ref={descRef}
                        className={cn(
                          "prose prose-sm dark:prose-invert max-w-none text-xs break-words leading-relaxed [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0",
                          !isExpanded && "line-clamp-2 overflow-hidden"
                        )}
                        dangerouslySetInnerHTML={{ __html: task.description || '' }}
                      />
                      {showSeeMore && (
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="text-[11px] font-semibold text-primary/80 hover:text-primary transition-colors flex items-center gap-0.5 mt-0.5"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? 'See less' : 'See more'}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {!isEditing && (
              <div className="mt-1 opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsDetailsOpen(true)}
                  className="p-1 hover:text-blue-500 text-muted-foreground transition-colors rounded hover:bg-muted"
                  title="View details"
                >
                  <Eye size={15} />
                </button>
                {!task.completed && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:text-primary text-muted-foreground transition-colors rounded hover:bg-muted"
                    title="Edit task"
                  >
                    <Edit2 size={15} />
                  </button>
                )}
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1 hover:text-destructive text-muted-foreground transition-colors rounded hover:bg-destructive/10"
                  title="Delete task"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </ContextMenu.Trigger>
      
      <ContextMenu.Content className="min-w-[160px] bg-popover text-popover-foreground shadow-md rounded-md border p-1 z-50 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
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
              className="flex items-center px-2 py-1.5 text-sm outline-none cursor-pointer rounded hover:bg-muted transition-colors mt-1 border-t rounded-t-none mb-1"
            >
               <ExternalLink className="mr-2 h-4 w-4" /> Open in Browser
            </ContextMenu.Item>
            <ContextMenu.Separator className="h-px bg-border my-1" />
          </>
        ) : null}

        <ContextMenu.Item 
          onSelect={() => onDelete(task.id)}
          className="flex items-center px-2 py-1.5 text-sm outline-none cursor-pointer rounded hover:bg-destructive/10 hover:text-destructive text-destructive/90 transition-colors"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Task
        </ContextMenu.Item>
        
        {folders.length > 1 && (
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="flex items-center px-2 py-1.5 text-sm outline-none cursor-default rounded hover:bg-muted focus:bg-muted data-[state=open]:bg-muted transition-colors mt-1">
               <ChevronDown className="mr-2 h-4 w-4 -rotate-90 text-muted-foreground" /> Move to...
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent className="min-w-[140px] bg-popover text-popover-foreground shadow-md rounded-md border p-1 z-50 animate-in fade-in zoom-in-95 slide-in-from-left-2">
              {folders.filter(f => f !== activeFolder).map(f => (
                <ContextMenu.Item 
                  key={f}
                  onSelect={() => onMove?.(task.id, f)}
                  className="flex items-center px-2 py-1.5 text-sm outline-none cursor-pointer rounded hover:bg-muted transition-colors"
                >
                  {f}
                </ContextMenu.Item>
              ))}
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        )}
      </ContextMenu.Content>
    </ContextMenu.Root>
      )}
    </Draggable>

    <TaskDetailsModal 
       key={task.id}
       task={task} 
       isOpen={isDetailsOpen} 
       onClose={() => setIsDetailsOpen(false)} 
       onDelete={onDelete}
       onToggle={onToggle}
       onUpdate={onUpdate}
    />
    </>
  );
});
