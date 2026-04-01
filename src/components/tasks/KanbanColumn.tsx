import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import type { TaskStatus } from '@/lib/constants';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: any[];
  onTaskClick: (task: any) => void;
  canManage: boolean;
}

export default function KanbanColumn({ status, tasks, onTaskClick, canManage }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/50 rounded-xl p-3 min-h-[300px] transition ${isOver ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{status}</h3>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              canManage={canManage}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
