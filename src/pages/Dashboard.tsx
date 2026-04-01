import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { RoleBadge, ZoneBadge } from '@/components/Badges';
import { daysUntilEvent, humanDate, isOverdue, isDueToday } from '@/lib/dateUtils';
import { EVENT_NAME, EVENT_DATE, EVENT_VENUE, EVENT_TIME } from '@/lib/constants';
import { CalendarDays, CheckSquare, FileText, MessageCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WelcomeModal from '@/components/WelcomeModal';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { user, isGuest } = useAuthStore();
  const { role, isAdmin, isGuestRole } = useRole();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [pinnedDocs, setPinnedDocs] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user && !user.has_seen_welcome && !isGuest) {
      setShowWelcome(true);
    }
  }, [user, isGuest]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [tasksRes, scheduleRes, docsRes, msgRes, profilesRes] = await Promise.all([
          supabase.from('tasks').select('*').order('due_date', { ascending: true }).limit(50),
          supabase.from('schedule_slots').select('*').order('time', { ascending: true }),
          supabase.from('documents').select('*').eq('pinned', true),
          supabase.from('messages').select('*').eq('channel', '#all-hands').order('created_at', { ascending: false }).limit(3),
          supabase.from('profiles').select('id, name, role, avatar_url'),
        ]);
        setTasks(tasksRes.data || []);
        setSchedule(scheduleRes.data || []);
        setPinnedDocs(docsRes.data || []);
        setRecentMessages((msgRes.data || []).reverse());
        const map: Record<string, any> = {};
        profilesRes.data?.forEach(p => { map[p.id] = p; });
        setProfiles(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();

    // Realtime messages
    const channel = supabase.channel('dashboard-msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'channel=eq.#all-hands' }, (payload) => {
        setRecentMessages(prev => [...prev, payload.new].slice(-3));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const myTasks = isAdmin ? tasks : isGuestRole ? tasks : tasks.filter(t => t.assignee_id === user?.id);
  // FIX 6: Filter out Done tasks, sort overdue first
  const openTasks = myTasks
    .filter(t => t.status !== 'Done')
    .sort((a, b) => {
      const aOverdue = isOverdue(a.due_date) ? 0 : isDueToday(a.due_date) ? 1 : 2;
      const bOverdue = isOverdue(b.due_date) ? 0 : isDueToday(b.due_date) ? 1 : 2;
      return aOverdue - bOverdue;
    });
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
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

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
          <h3 className="font-bold text-amber-800 mb-2">🚀 Getting Started</h3>
          <div className="text-sm text-amber-700 space-y-1">
            <p>1. <strong>Add team members</strong> → People & Roles → Add Person</p>
            <p>2. <strong>Assign tasks</strong> → Task Board → click any card</p>
            <p>3. <strong>Send an announcement</strong> → Announcements → New</p>
          </div>
        </div>
      )}

      {isGuestRole && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          You're viewing as a guest. <a href="/login" className="font-medium text-primary underline">Sign in</a> for full access.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Tasks - FIX 6: no Done tasks, max 6, sorted */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><CheckSquare size={18} /> My Tasks</h2>
          {openTasks.length === 0 ? (
            <div className="text-center py-6">
              <CheckSquare className="mx-auto mb-2 text-muted-foreground" size={32} />
              <p className="text-sm text-muted-foreground">All caught up! No open tasks 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openTasks.slice(0, 6).map((task) => (
                <div key={task.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition ${
                    isOverdue(task.due_date) ? 'border-l-4 border-l-red-400 border-red-200 bg-red-50' :
                    isDueToday(task.due_date) ? 'border-l-4 border-l-amber-400 border-amber-200 bg-amber-50' :
                    'border-border'
                  }`}
                  onClick={() => navigate('/tasks')}
                >
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <ZoneBadge zone={task.zone} />
                    <span className="text-xs text-muted-foreground">{humanDate(task.due_date)}</span>
                  </div>
                </div>
              ))}
              {openTasks.length > 6 && (
                <button onClick={() => navigate('/tasks')} className="text-sm text-primary font-medium flex items-center gap-1 mt-2 hover:underline">
                  View all tasks <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><CalendarDays size={18} /> Schedule</h2>
          {schedule.length === 0 ? (
            <div className="text-center py-6">
              <CalendarDays className="mx-auto mb-2 text-muted-foreground" size={32} />
              <p className="text-sm text-muted-foreground">No schedule slots yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedule.slice(0, 6).map((slot) => (
                <div key={slot.id} className="p-3 rounded-lg border border-border hover:shadow-sm transition cursor-pointer" onClick={() => navigate('/schedule')}>
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

      {/* FIX 3: Recent Messages Card */}
      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><MessageCircle size={18} /> Recent Messages</h2>
        {recentMessages.length === 0 ? (
          <div className="text-center py-6">
            <MessageCircle className="mx-auto mb-2 text-muted-foreground" size={32} />
            <p className="text-sm text-muted-foreground">No messages yet — start the conversation in Chat</p>
            <button onClick={() => navigate('/chat')} className="mt-3 gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
              Open Chat
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {recentMessages.map((msg) => {
                const sender = profiles[msg.sender_id];
                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold shrink-0" style={{ background: sender?.avatar_url ? 'none' : 'linear-gradient(135deg, #7C3AED, #F97316)', color: 'white' }}>
                      {sender?.avatar_url ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" /> : (sender?.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{sender?.name || 'Unknown'}</span>
                        {sender?.role && <RoleBadge role={sender.role} />}
                        <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => navigate('/chat')} className="mt-3 text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              Go to Chat <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>

      {pinnedDocs.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><FileText size={18} /> Pinned Documents</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {pinnedDocs.map((doc) => (
              <div key={doc.id} className="p-3 rounded-lg border border-border hover:bg-accent/50 hover:shadow-sm transition cursor-pointer">
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
