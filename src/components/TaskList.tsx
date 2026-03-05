import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useTasks } from '@/context/TaskContext';
import { TaskItem } from './TaskItem';
import { motion, AnimatePresence } from 'framer-motion';

export function TaskList() {
  const { tasks, reorderTasks, filterOption, searchQuery } = useTasks();

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

  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm flex-col gap-2">
        <p>No tasks yet.</p>
        <p className="opacity-70">Add one below to get started.</p>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        No tasks match your filter.
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
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskItem task={task} index={index} />
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
