import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { RoleBadge, ZoneBadge } from '@/components/Badges';
import { daysUntilEvent, humanDate, isOverdue, isDueToday } from '@/lib/dateUtils';
import { EVENT_NAME, EVENT_DATE, EVENT_VENUE, EVENT_TIME } from '@/lib/constants';
import { CalendarDays, CheckSquare, FileText } from 'lucide-react';

export default function Dashboard() {
  const { user, isGuest } = useAuthStore();
  const { role, isAdmin, isGuestRole } = useRole();
  const [tasks, setTasks] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [pinnedDocs, setPinnedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [tasksRes, scheduleRes, docsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('due_date', { ascending: true }).limit(50),
        supabase.from('schedule_slots').select('*').order('time', { ascending: true }),
        supabase.from('documents').select('*').eq('pinned', true),
      ]);
      setTasks(tasksRes.data || []);
      setSchedule(scheduleRes.data || []);
      setPinnedDocs(docsRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const myTasks = isAdmin ? tasks : isGuestRole ? tasks : tasks.filter(t => t.assignee_id === user?.id);
  const openTasks = myTasks.filter(t => t.status !== 'Done');
  const overdueTasks = openTasks.filter(t => isOverdue(t.due_date));
  const days = daysUntilEvent();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Hero */}
      <div className="rounded-2xl p-6 text-white" style={{background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)'}}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-lg">
            {(user?.name || "G")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-black">
              Hey, {isGuestRole ? "Guest" : user?.name?.split(" ")[0]}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <RoleBadge role={role} />
              {user?.zone && <ZoneBadge zone={user.zone} />}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <div className="font-black text-xl">{days}</div>
            <div className="text-xs opacity-90">Days to Event</div>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <div className="font-black text-xl">{openTasks.length}</div>
            <div className="text-xs opacity-90">Open Tasks</div>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <div className="font-black text-xl">{overdueTasks.length}</div>
            <div className="text-xs opacity-90">Overdue</div>
          </div>
        </div>
      </div>

      {/* Admin Getting Started */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold text-amber-800 mb-2">
            🚀 Getting Started
          </h3>
          <div className="text-sm text-amber-700 space-y-1">
            <p>1. <strong>Add team members</strong> → People & Roles → Add Person</p>
            <p>2. <strong>Assign tasks</strong> → Task Board → click any card</p>
            <p>3. <strong>Send an announcement</strong> → Announcements → New</p>
          </div>
        </div>
      )}

      {/* Guest Banner */}
      {isGuestRole && (
        <div className="bg-gainx-amber/10 border border-gainx-amber/30 rounded-xl p-4 text-sm">
          You're viewing as a guest. <a href="/login" className="font-medium text-primary underline">Sign in</a> for full access.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><CheckSquare size={18} /> My Tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks assigned yet</p>
          ) : (
            <div className="space-y-2">
              {myTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border ${
                    task.status === 'Done' ? 'border-gainx-emerald/30 bg-gainx-emerald/5' :
                    isOverdue(task.due_date) ? 'border-destructive/50 bg-destructive/5' :
                    isDueToday(task.due_date) ? 'border-gainx-amber/50 bg-gainx-amber/5' :
                    'border-border'
                  }`}
                >
                  <p className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <ZoneBadge zone={task.zone} />
                    <span className="text-xs text-muted-foreground">{humanDate(task.due_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Preview */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><CalendarDays size={18} /> Schedule</h2>
          {schedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedule slots yet</p>
          ) : (
            <div className="space-y-2">
              {schedule.slice(0, 6).map((slot) => (
                <div key={slot.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold">{slot.time}</span>
                    <span className="text-sm font-medium">{slot.activity}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ZoneBadge zone={slot.zone} />
                    {slot.location && <span className="text-xs text-muted-foreground">{slot.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pinned Docs */}
      {pinnedDocs.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><FileText size={18} /> Pinned Documents</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {pinnedDocs.map((doc) => (
              <div key={doc.id} className="p-3 rounded-lg border border-border hover:bg-accent/50 transition cursor-pointer">
                <p className="text-sm font-medium">{doc.title}</p>
                <p className="text-xs text-muted-foreground">{doc.folder}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

