import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { RoleBadge } from '@/components/Badges';
import { Send, Hash } from 'lucide-react';
import { ContextualTooltip } from '@/components/ContextualTooltip';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { usePresence } from '@/hooks/usePresence';

const ZONE_CHANNEL_MAP: Record<string, string> = {
  'Move Floor': '#move-floor',
  'Reset Space': '#reset-space',
  'Link-Up': '#link-up',
  'Vendor Row': '#vendor-row',
};

function getChannelsForRole(role: string, zone?: string): string[] {
  if (role === 'admin') return ['#all-hands', '#move-floor', '#reset-space', '#link-up', '#vendor-row'];
  if (role === 'vendor') return ['#all-hands', '#vendor-row'];
  if (role === 'guest') return [];
  // zone_lead, volunteer, instructor, reset_space_partner
  const zoneChannel = zone ? ZONE_CHANNEL_MAP[zone] : undefined;
  return zoneChannel ? ['#all-hands', zoneChannel] : ['#all-hands'];
}

export default function Chat() {
  const { user } = useAuthStore();
  const { role } = useRole();
  const allowedChannels = getChannelsForRole(role, user?.zone);
  const [channel, setChannel] = useState<string>(allowedChannels[0] || '#all-hands');
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

  // Reset channel if not allowed
  useEffect(() => {
    if (!allowedChannels.includes(channel) && allowedChannels.length > 0) {
      setChannel(allowedChannels[0]);
    }
  }, [allowedChannels, channel]);

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
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = { id: tempId, channel, sender_id: user.id, text: msgText, created_at: new Date().toISOString(), _sending: true };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    setSending(true);
    const { error } = await supabase.from('messages').insert({ channel, sender_id: user.id, text: msgText });
    setSending(false);
    if (error) setMessages(prev => prev.filter(m => m.id !== tempId));
  };

  if (allowedChannels.length === 0) {
    return <div className="text-center py-16 text-muted-foreground">Chat is not available in guest mode. <a href="/login" className="text-primary underline">Sign in</a> for access.</div>;
  }

  return (
    <div>
      <ContextualTooltip screen="chat" />
      <div className="flex h-[calc(100vh-8rem)] gap-4 max-w-5xl">
        {/* Channels */}
        <div className="hidden md:block w-48 bg-card border border-border rounded-xl p-2 shrink-0">
          <h3 className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Channels</h3>
          {allowedChannels.map(ch => (
            <button key={ch} onClick={() => setChannel(ch)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${channel === ch ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
              <Hash size={14} /> {ch.replace('#', '')}
            </button>
          ))}
          <div className="mt-3 px-2 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
            {onlineUsers.length} online
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
          <div className="md:hidden p-2 border-b border-border">
            <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background">
              {allowedChannels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </div>

          <div className="p-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-1.5"><Hash size={16} /> {channel.replace('#', '')}</h2>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              {onlineUsers.length} online
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No messages yet. Start the conversation!</p>}
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
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..."
              className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={e => e.key === 'Enter' && send()} />
            <button onClick={send} disabled={sending} className="gradient-primary text-primary-foreground p-2.5 rounded-lg disabled:opacity-50"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
