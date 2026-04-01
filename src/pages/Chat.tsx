import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { RoleBadge } from '@/components/Badges';
import { CHANNELS } from '@/lib/constants';
import { Send, Hash } from 'lucide-react';
import { ContextualTooltip } from '@/components/ContextualTooltip';

export default function Chat() {
  const { user } = useAuthStore();
  const [channel, setChannel] = useState<string>(CHANNELS[0]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('profiles').select('id, name, role, avatar_url').then(({ data }) => {
      const map: Record<string, any> = {};
      data?.forEach(p => { map[p.id] = p; });
      setProfiles(map);
    });
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('channel', channel).order('created_at', { ascending: true }).limit(100);
      setMessages(data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    fetchMessages();
    const sub = supabase.channel(`chat-${channel}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel=eq.${channel}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [channel]);

  const send = async () => {
    if (!text.trim() || !user) return;
    await supabase.from('messages').insert({ channel, sender_id: user.id, text: text.trim() });
    setText('');
  };

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
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
        {/* Mobile channel selector */}
        <div className="md:hidden p-2 border-b border-border">
          <select value={channel} onChange={e => setChannel(e.target.value as any)} className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-background">
            {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
          </select>
        </div>

        <div className="p-3 border-b border-border">
          <h2 className="font-semibold text-sm flex items-center gap-1.5"><Hash size={16} /> {channel.replace('#', '')}</h2>
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
                <div className={`max-w-[75%] ${isMine ? 'gradient-primary text-primary-foreground' : 'bg-muted'} rounded-xl px-3.5 py-2.5`}>
                  {!isMine && sender && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold">{sender.name}</span>
                      <RoleBadge role={sender.role} />
                    </div>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <button onClick={send} className="gradient-primary text-primary-foreground p-2.5 rounded-lg"><Send size={16} /></button>
        </div>
      </div>
    </div>
    </div>
  );
}
