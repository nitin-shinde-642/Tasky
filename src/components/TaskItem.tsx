import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Task } from '@/types/task';
import { useTasks } from '@/context/TaskContext';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  index: number;
}

export function TaskItem({ task, index }: TaskItemProps) {
  const { toggleTaskCompletion, deleteTask } = useTasks();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
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
            >
              <GripVertical size={16} />
            </div>

            <div className="mt-1 h-5 w-5 flex items-center justify-center">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTaskCompletion(task.id)}
              />
            </div>

            <div className="flex flex-1 flex-col justify-center min-w-0">
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

              {(task.description || task.completedAt) && (
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(task.createdAt, 'MMM d')}</span>
                  {task.description && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {isExpanded ? 'Hide info' : 'More info'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => deleteTask(task.id)}
              className="mt-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive text-muted-foreground"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <AnimatePresence>
            {isExpanded && task.description && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pl-11 pr-8 text-sm text-foreground/80 whitespace-pre-wrap"
              >
                <div className="pt-2 pb-1 border-t">
                  {task.description}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Draggable>
  );
}
