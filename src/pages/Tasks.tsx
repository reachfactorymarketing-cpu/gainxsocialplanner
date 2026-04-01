import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { ZoneBadge, PriorityBadge } from '@/components/Badges';
import { TASK_COLUMNS, ZONES, type TaskStatus } from '@/lib/constants';
import { humanDate, isOverdue, isDueToday } from '@/lib/dateUtils';
import { Plus, X, GripVertical, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuthStore();
  const { canManageTasks, isGuestRole } = useRole();
  const [tasks, setTasks] = useState<any[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    setTasks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const filtered = zoneFilter === 'All' ? tasks : tasks.filter(t => t.zone === zoneFilter);

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, status: newStatus });
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Task Board</h1>
        {canManageTasks && (
          <button onClick={() => setShowCreate(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Zone Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', ...ZONES].map((z) => (
          <button
            key={z}
            onClick={() => setZoneFilter(z)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              zoneFilter === z ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {z}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {TASK_COLUMNS.map((col) => {
          const colTasks = filtered.filter(t => t.status === col);
          return (
            <div key={col} className="bg-muted/50 rounded-xl p-3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{col}</h3>
                <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    onMove={moveTask}
                    canManage={canManageTasks && !isGuestRole}
                  />
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onMove={moveTask}
          canManage={canManageTasks && !isGuestRole}
        />
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchTasks}
          userId={user?.id}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onClick, onMove, canManage }: { task: any; onClick: () => void; onMove: (id: string, s: TaskStatus) => void; canManage: boolean }) {
  const done = task.status === 'Done';
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-lg p-3 border cursor-pointer hover:shadow-md transition ${
        done ? 'border-gainx-emerald/30' :
        isOverdue(task.due_date) ? 'border-l-4 border-l-destructive border-border' :
        isDueToday(task.due_date) ? 'border-l-4 border-l-gainx-amber border-border' :
        'border-border'
      }`}
    >
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
  );
}

function TaskDrawer({ task, onClose, onMove, canManage }: { task: any; onClose: () => void; onMove: (id: string, s: TaskStatus) => void; canManage: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    supabase.from('task_comments').select('*').eq('task_id', task.id).order('created_at').then(({ data }) => setComments(data || []));
    supabase.from('task_checklist_items').select('*').eq('task_id', task.id).order('position').then(({ data }) => setChecklist(data || []));
  }, [task.id]);

  const addComment = async () => {
    if (!newComment.trim() || !user) return;
    await supabase.from('task_comments').insert({ task_id: task.id, author_id: user.id, text: newComment });
    setComments(prev => [...prev, { id: Date.now(), text: newComment, created_at: new Date().toISOString() }]);
    setNewComment('');
  };

  const toggleCheck = async (item: any) => {
    await supabase.from('task_checklist_items').update({ done: !item.done }).eq('id', item.id);
    setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, done: !c.done } : c));
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">{task.title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <ZoneBadge zone={task.zone} />
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-muted-foreground">{humanDate(task.due_date)}</span>
          </div>
          
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

          {/* Status Buttons */}
          {canManage && (
            <div className="flex gap-2 flex-wrap">
              {TASK_COLUMNS.map((col) => (
                <button
                  key={col}
                  onClick={() => onMove(task.id, col)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    task.status === col ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          )}

          {/* Checklist */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Checklist</h3>
            {checklist.length === 0 ? (
              <p className="text-xs text-muted-foreground">No checklist items</p>
            ) : (
              <div className="space-y-1.5">
                {checklist.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item)} className="rounded" />
                    <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><MessageSquare size={14} /> Comments</h3>
            <div className="space-y-2 mb-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-muted rounded-lg p-2.5 text-sm">{c.text}</div>
              ))}
            </div>
            {!useAuthStore.getState().isGuest && (
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === 'Enter' && addComment()}
                />
                <button onClick={addComment} className="px-3 py-2 gradient-primary text-primary-foreground rounded-lg text-sm">Send</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CreateTaskModal({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId?: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('General');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await supabase.from('tasks').insert({
      title, description, zone, priority: priority as any,
      due_date: dueDate || null, created_by: userId,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">New Task</h2>
            <button type="button" onClick={onClose}><X size={20} /></button>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-20 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={zone} onChange={(e) => setZone(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-sm bg-background">
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-sm bg-background">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </>
  );
}
