import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user || isGuest) return;
    
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setNotifications(data);
        setCount(data.filter((n) => !n.read).length);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, fetchNotifications)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isGuest]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setCount(0);
  };

  if (isGuest) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-accent transition">
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
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
              {count > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
              )}
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-3 border-b border-border hover:bg-accent/50 transition ${!n.read ? 'border-l-2 border-l-primary' : ''}`}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
