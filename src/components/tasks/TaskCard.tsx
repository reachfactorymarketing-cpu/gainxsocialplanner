import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ZoneBadge, PriorityBadge } from '@/components/Badges';
import { humanDate, isOverdue, isDueToday } from '@/lib/dateUtils';
import { GripVertical } from 'lucide-react';
import type { TaskStatus } from '@/lib/constants';

interface TaskCardProps {
  task: any;
  onClick: () => void;
  canManage: boolean;
}

export default function TaskCard({ task, onClick, canManage }: TaskCardProps) {
  const done = task.status === 'Done';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
    disabled: !canManage,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`bg-card rounded-lg p-3 border cursor-pointer hover:shadow-md transition ${
        done ? 'border-l-4 border-l-green-400 border-border' :
        isOverdue(task.due_date) ? 'border-l-4 border-l-red-400 border-border' :
        isDueToday(task.due_date) ? 'border-l-4 border-l-amber-400 border-border' :
        'border-l-4 border-l-transparent border-border'
      }`}
    >
      <div className="flex items-start gap-1.5">
        {canManage && (
          <button {...attributes} {...listeners} className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" onClick={e => e.stopPropagation()}>
            <GripVertical size={14} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <ZoneBadge zone={task.zone} />
            <PriorityBadge priority={task.priority} />
          </div>
          {task.due_date && (
            <p className={`text-xs mt-1.5 ${isOverdue(task.due_date) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              {humanDate(task.due_date)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
