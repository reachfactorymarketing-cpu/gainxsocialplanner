import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel('connection-monitor');
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setDisconnected(false);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setDisconnected(true);
      }
    });

    const handleOffline = () => setDisconnected(true);
    const handleOnline = () => setDisconnected(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!disconnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] bg-destructive text-destructive-foreground text-center text-sm py-1.5 px-4 flex items-center justify-center gap-2">
      <WifiOff size={14} />
      Connection lost — updates paused. Reconnecting…
    </div>
  );
}
