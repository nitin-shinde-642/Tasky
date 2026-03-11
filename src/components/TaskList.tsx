import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useTasks } from '@/context/TaskContext';
import { TaskItem } from './TaskItem';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, SearchX } from 'lucide-react';

export function TaskList() {
  const { tasks, reorderTasks, filterOption, searchQuery, toggleTaskCompletion, deleteTask, updateTask, moveTask, isLoading } = useTasks();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    // Only allow reordering when viewing "All" and no search query
    // This prevents index mismatch bugs when list is filtered
    if (filterOption === 'All' && !searchQuery) {
      reorderTasks(result.source.index, result.destination.index);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    // Search match
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Filter match
    if (filterOption === 'Completed' && !task.completed) return false;
    if (filterOption === 'Pending' && task.completed) return false;
    
    return true;
  });

  const isReorderEnabled = filterOption === 'All' && !searchQuery;

  if (isLoading) {
    return (
      <div className="flex-1 w-full space-y-3 p-1 animate-in fade-in duration-300">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 p-4 rounded-lg border bg-card/40 shadow-sm animate-pulse items-center">
            <div className="w-5 h-5 rounded-md bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted/60 rounded-md w-[80%]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-4 text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ClipboardList className="w-8 h-8 text-primary/60" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">You're all caught up!</p>
          <p className="text-sm text-muted-foreground">Add a new task below to get started.</p>
        </div>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-3 text-center p-8 animate-in fade-in duration-300">
        <SearchX className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No tasks match your filter.</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable 
        droppableId="task-list" 
        isDropDisabled={!isReorderEnabled}
      >
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex-1 w-full overflow-y-auto overflow-x-hidden p-1 pr-2 pb-24 space-y-2 custom-scrollbar"
          >
            <AnimatePresence initial={false}>
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskItem 
                    task={task} 
                    index={index} 
                    onToggle={toggleTaskCompletion} 
                    onDelete={deleteTask} 
                    onUpdate={updateTask}
                    onMove={moveTask}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
