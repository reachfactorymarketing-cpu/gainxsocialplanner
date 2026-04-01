import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { RoleBadge, ZoneBadge } from '@/components/Badges';
import { daysUntilEvent, humanDate, isOverdue, isDueToday } from '@/lib/dateUtils';
import { EVENT_NAME, EVENT_DATE, EVENT_VENUE, EVENT_TIME } from '@/lib/constants';
import { CalendarDays, CheckSquare, AlertTriangle, FileText, Clock } from 'lucide-react';

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

  const myTasks = isGuestRole ? tasks : tasks.filter(t => t.assignee_id === user?.id);
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
      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold">{EVENT_NAME}</h1>
        <p className="text-sm opacity-90 mt-1">{EVENT_VENUE} · {EVENT_TIME}</p>
        <div className="flex items-center gap-3 mt-3">
          {!isGuestRole && (
            <>
              <span className="text-sm">Welcome, {user?.name || 'Team Member'}</span>
              <RoleBadge role={role} />
              {user?.zone && <ZoneBadge zone={user.zone} />}
            </>
          )}
          {isGuestRole && <span className="text-sm">Guest Access · Read Only</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<CalendarDays size={20} />} label="Days to Event" value={days.toString()} color="text-primary" />
        <StatCard icon={<CheckSquare size={20} />} label="Open Tasks" value={openTasks.length.toString()} color="text-gainx-blue" />
        <StatCard icon={<AlertTriangle size={20} />} label="Overdue" value={overdueTasks.length.toString()} color="text-destructive" />
        <StatCard icon={<Clock size={20} />} label="Total Tasks" value={tasks.length.toString()} color="text-gainx-teal" />
      </div>

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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
