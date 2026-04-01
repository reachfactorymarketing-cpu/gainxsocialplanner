import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { RoleBadge } from '@/components/Badges';
import { CHANNELS } from '@/lib/constants';
import { Send, Hash } from 'lucide-react';
import { ContextualTooltip } from '@/components/ContextualTooltip';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { usePresence } from '@/hooks/usePresence';

export default function Chat() {
  const { user } = useAuthStore();
  const [channel, setChannel] = useState<string>(CHANNELS[0]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { onlineUsers } = usePresence();

  useEffect(() => {
    supabase.from('profiles').select('id, name, role, avatar_url').then(({ data }) => {
      const map: Record<string, any> = {};
      data?.forEach(p => { map[p.id] = p; });
      setProfiles(map);
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*').eq('channel', channel).order('created_at', { ascending: true }).limit(100);
    setMessages(data || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [channel]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useRealtimeSubscription('messages', fetchMessages, `channel=eq.${channel}`);

  const send = async () => {
    if (!text.trim() || !user || sending) return;
    const msgText = text.trim();
    setText('');
    
    // Optimistic: add message immediately with temp id
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      channel,
      sender_id: user.id,
      text: msgText,
      created_at: new Date().toISOString(),
      _sending: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    setSending(true);
    const { error } = await supabase.from('messages').insert({ channel, sender_id: user.id, text: msgText });
    setSending(false);
    
    if (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
    // Realtime subscription will bring the real message
  };

  const onlineInChannel = onlineUsers.length;

  return (
    <div>
      <ContextualTooltip screen="chat" />
    <div className="flex h-[calc(100vh-8rem)] gap-4 max-w-5xl">
      {/* Channels */}
      <div className="hidden md:block w-48 bg-card border border-border rounded-xl p-2 shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Channels</h3>
        {CHANNELS.map(ch => (
          <button
            key={ch}
            onClick={() => setChannel(ch)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${channel === ch ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
          >
            <Hash size={14} /> {ch.replace('#', '')}
          </button>
        ))}
        <div className="mt-3 px-2 text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
          {onlineInChannel} online
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
        {/* Mobile channel selector */}
        <div className="md:hidden p-2 border-b border-border">
          <select value={channel} onChange={e => setChannel(e.target.value as any)} className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background">
            {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
          </select>
        </div>

        <div className="p-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-1.5"><Hash size={16} /> {channel.replace('#', '')}</h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            {onlineInChannel} online
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">No messages yet. Start the conversation!</p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            const sender = profiles[msg.sender_id];
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'gradient-primary text-primary-foreground' : 'bg-muted'} rounded-xl px-3.5 py-2.5 ${msg._sending ? 'opacity-60' : ''}`}>
                  {!isMine && sender && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold">{sender.name}</span>
                      <RoleBadge role={sender.role} />
                    </div>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {msg._sending ? 'Sending...' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-border flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={send} disabled={sending} className="gradient-primary text-primary-foreground p-2.5 rounded-lg disabled:opacity-50"><Send size={16} /></button>
        </div>
      </div>
    </div>
    </div>
  );
}
