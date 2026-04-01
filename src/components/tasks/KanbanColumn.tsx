import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import type { TaskStatus } from '@/lib/constants';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: any[];
  onTaskClick: (task: any) => void;
  canManage: boolean;
  onAddTask?: (status: TaskStatus) => void;
  profiles?: Record<string, any>;
}

export default function KanbanColumn({ status, tasks, onTaskClick, canManage, onAddTask, profiles }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/50 rounded-xl p-3 flex flex-col transition ${isOver ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{status}</h3>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 font-bold">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 overflow-y-auto max-h-[55vh] pr-1" style={{ scrollbarWidth: 'thin' }}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              canManage={canManage}
              assignee={profiles?.[task.assignee_id]}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
          )}
        </div>
      </SortableContext>
      {canManage && onAddTask && (
        <button
          onClick={() => onAddTask(status)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground py-2 rounded-lg border border-dashed border-border hover:border-primary/50 transition"
        >
          <Plus size={14} /> Add Task
        </button>
      )}
    </div>
  );
}
