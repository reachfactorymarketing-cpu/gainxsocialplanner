import { useEffect, useState, useCallback } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent, type DragOverEvent } from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { ZoneBadge, PriorityBadge, RoleBadge } from '@/components/Badges';
import { TASK_COLUMNS, ZONES, type TaskStatus } from '@/lib/constants';
import { ContextualTooltip } from '@/components/ContextualTooltip';
import { humanDate, isOverdue, isDueToday } from '@/lib/dateUtils';
import { Plus, X, MessageSquare, Save, Trash2 } from 'lucide-react';
import KanbanColumn from '@/components/tasks/KanbanColumn';

export default function Tasks() {
  const { user } = useAuthStore();
  const { canManageTasks, isGuestRole } = useRole();
  const [tasks, setTasks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('To Do');
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchTasks = useCallback(async () => {
    const [{ data }, { data: profs }] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, role, avatar_url'),
    ]);
    setTasks(data || []);
    const map: Record<string, any> = {};
    profs?.forEach(p => { map[p.id] = p; });
    setProfiles(map);
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
    if (selectedTask?.id === taskId) setSelectedTask((prev: any) => prev ? { ...prev, status: newStatus } : null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = TASK_COLUMNS.includes(over.id as TaskStatus)
      ? (over.id as TaskStatus)
      : tasks.find(t => t.id === over.id)?.status;
    if (!newStatus) return;
    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    let newStatus: TaskStatus | undefined;
    if (TASK_COLUMNS.includes(over.id as TaskStatus)) {
      newStatus = over.id as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      newStatus = overTask?.status;
    }
    if (newStatus) {
      const currentTask = tasks.find(t => t.id === taskId);
      if (currentTask && currentTask.status !== newStatus) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      }
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setCreateStatus(status);
    setShowCreate(true);
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <ContextualTooltip screen="tasks" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Task Board</h1>
        {canManageTasks && (
          <button onClick={() => { setCreateStatus('To Do'); setShowCreate(true); }} className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', ...ZONES].map((z) => (
          <button
            key={z}
            onClick={() => setZoneFilter(z)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              zoneFilter === z ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {z}
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TASK_COLUMNS.map((col) => (
            <KanbanColumn
              key={col}
              status={col}
              tasks={filtered.filter(t => t.status === col)}
              onTaskClick={setSelectedTask}
              canManage={canManageTasks && !isGuestRole}
              onAddTask={canManageTasks ? handleAddTask : undefined}
              profiles={profiles}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-card rounded-lg p-3 border shadow-lg opacity-90 w-64">
              <p className="text-sm font-medium">{activeTask.title}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <ZoneBadge zone={activeTask.zone} />
                <PriorityBadge priority={activeTask.priority} />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} onMove={moveTask} canManage={canManageTasks && !isGuestRole} profiles={profiles} onRefresh={fetchTasks} />
      )}

      {showCreate && (
        <CreateTaskModal onClose={() => setShowCreate(false)} onCreated={fetchTasks} userId={user?.id} defaultStatus={createStatus} profiles={profiles} />
      )}
    </div>
  );
}

function TaskDrawer({ task, onClose, onMove, canManage, profiles, onRefresh }: { task: any; onClose: () => void; onMove: (id: string, s: TaskStatus) => void; canManage: boolean; profiles: Record<string, any>; onRefresh: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      supabase.from('task_comments').select('*').eq('task_id', task.id).order('created_at'),
      supabase.from('task_checklist_items').select('*').eq('task_id', task.id).order('position'),
    ]).then(([cRes, chRes]) => {
      setComments(cRes.data || []);
      setChecklist(chRes.data || []);
    });
  }, [task.id]);

  const addComment = async () => {
    if (!newComment.trim() || !user) return;
    const { data } = await supabase.from('task_comments').insert({ task_id: task.id, author_id: user.id, text: newComment }).select().single();
    setComments(prev => [...prev, data || { id: Date.now(), text: newComment, author_id: user.id, created_at: new Date().toISOString() }]);
    setNewComment('');
  };

  const toggleCheck = async (item: any) => {
    await supabase.from('task_checklist_items').update({ done: !item.done }).eq('id', item.id);
    setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, done: !c.done } : c));
  };

  const addCheckItem = async () => {
    if (!newCheckItem.trim()) return;
    const pos = checklist.length;
    const { data } = await supabase.from('task_checklist_items').insert({ task_id: task.id, text: newCheckItem, position: pos }).select().single();
    setChecklist(prev => [...prev, data || { id: Date.now(), text: newCheckItem, done: false, position: pos }]);
    setNewCheckItem('');
  };

  const removeCheckItem = async (id: string) => {
    await supabase.from('task_checklist_items').delete().eq('id', id);
    setChecklist(prev => prev.filter(c => c.id !== id));
  };

  const saveTask = async () => {
    setSaving(true);
    await supabase.from('tasks').update({
      title, description, assignee_id: assigneeId || null, due_date: dueDate || null,
    }).eq('id', task.id);
    setSaving(false);
    onRefresh();
    onClose();
  };

  const assignee = profiles[task.assignee_id];
  const profileList = Object.values(profiles);

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-lg">Task Details</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Title */}
          {canManage ? (
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full text-lg font-semibold border-b border-transparent hover:border-input focus:border-input pb-1 bg-transparent focus:outline-none" />
          ) : (
            <h3 className="text-lg font-semibold">{task.title}</h3>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <ZoneBadge zone={task.zone} />
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-muted-foreground">{humanDate(task.due_date)}</span>
          </div>

          {/* Description */}
          {canManage ? (
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add description..." className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background h-20 resize-none" />
          ) : (
            task.description && <p className="text-sm text-muted-foreground">{task.description}</p>
          )}

          {/* Assignee */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Assignee</label>
            {canManage ? (
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                <option value="">Unassigned</option>
                {profileList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <p className="text-sm">{assignee?.name || 'Unassigned'}</p>
            )}
          </div>

          {/* Due Date */}
          {canManage && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
          )}

          {/* Status buttons */}
          {canManage && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <div className="flex gap-2 flex-wrap">
                {TASK_COLUMNS.map((col) => (
                  <button key={col} onClick={() => onMove(task.id, col)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${task.status === col ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Checklist</h3>
            {checklist.length === 0 && !canManage ? (
              <p className="text-xs text-muted-foreground">No checklist items</p>
            ) : (
              <div className="space-y-1.5">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm group">
                    <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item)} className="rounded" />
                    <span className={`flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                    {canManage && (
                      <button onClick={() => removeCheckItem(item.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {canManage && (
              <div className="flex gap-2 mt-2">
                <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} placeholder="Add checklist item..."
                  className="flex-1 text-sm border border-input rounded-lg px-3 py-1.5 bg-background"
                  onKeyDown={e => e.key === 'Enter' && addCheckItem()} />
                <button onClick={addCheckItem} className="text-xs px-3 py-1.5 bg-muted rounded-lg hover:bg-accent">Add</button>
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><MessageSquare size={14} /> Comments</h3>
            <div className="space-y-2 mb-3">
              {comments.map((c) => {
                const author = profiles[c.author_id];
                return (
                  <div key={c.id} className="bg-muted rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold">{author?.name || 'Unknown'}</span>
                      {author?.role && <RoleBadge role={author.role} />}
                    </div>
                    <p className="text-sm">{c.text}</p>
                  </div>
                );
              })}
            </div>
            {!useAuthStore.getState().isGuest && (
              <div className="flex gap-2">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..."
                  className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === 'Enter' && addComment()} />
                <button onClick={addComment} className="px-3 py-2 gradient-primary text-white rounded-lg text-sm">Send</button>
              </div>
            )}
          </div>

          {/* Save/Close */}
          {canManage && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <button onClick={saveTask} disabled={saving} className="flex-1 gradient-primary text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={onClose} className="flex-1 bg-muted text-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-accent">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CreateTaskModal({ onClose, onCreated, userId, defaultStatus, profiles }: { onClose: () => void; onCreated: () => void; userId?: string; defaultStatus: TaskStatus; profiles: Record<string, any> }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('General');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);

  const profileList = Object.values(profiles);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await supabase.from('tasks').insert({
      title, description, zone, priority: priority as any,
      due_date: dueDate || null, created_by: userId,
      status: defaultStatus as any,
      assignee_id: assigneeId || null,
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
          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            <option value="">Unassigned</option>
            {profileList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
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
          <button type="submit" disabled={saving} className="w-full gradient-primary text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </>
  );
}
