import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckSquare, Megaphone, MessageCircle, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { toast } from 'sonner';

const ICONS: Record<string, any> = {
  task: CheckSquare,
  announcement: Megaphone,
  message: MessageCircle,
  warning: AlertTriangle,
  info: Bell,
};

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user || isGuest) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      const prevCount = count;
      const newCount = data.filter((n) => !n.read).length;
      setNotifications(data);
      setCount(newCount);
      
      // Toast for new notifications
      if (newCount > prevCount && prevCount > 0) {
        const newest = data[0];
        if (newest && !newest.read) {
          toast(newest.title, { description: newest.body || undefined, duration: 4000 });
        }
      }
    }
  }, [user, isGuest]);

  useEffect(() => {
    if (!user || isGuest) return;
    fetchNotifications();
  }, [user, isGuest, fetchNotifications]);

  useRealtimeSubscription(
    'notifications',
    fetchNotifications,
    user ? `user_id=eq.${user.id}` : undefined
  );

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setCount(0);
  };

  const handleClick = (n: any) => {
    if (n.screen) {
      navigate(n.screen);
      setOpen(false);
    }
  };

  if (isGuest) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-accent transition">
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 max-h-96 bg-card rounded-xl border border-border shadow-lg z-50 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                )}
                <button onClick={() => setOpen(false)}><X size={16} className="text-muted-foreground" /></button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto mb-2 text-muted-foreground" size={24} />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICONS[n.type] || Bell;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`p-3 border-b border-border hover:bg-accent/50 transition cursor-pointer flex items-start gap-3 ${!n.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                    >
                      <Icon size={16} className={`mt-0.5 shrink-0 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!n.read ? '' : 'text-muted-foreground'}`}>{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
