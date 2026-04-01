import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeSubscription(
  table: string,
  onUpdate: () => void,
  filter?: string
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const channelName = `realtime-${table}-${filter || 'all'}-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        () => onUpdateRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
