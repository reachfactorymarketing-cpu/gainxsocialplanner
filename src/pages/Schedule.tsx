import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { ZoneBadge } from '@/components/Badges';
import { ContextualTooltip } from '@/components/ContextualTooltip';
import { Plus, X, Calendar } from 'lucide-react';
import { ZONES, ROLE_LABELS } from '@/lib/constants';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const PHASES = ['setup', 'event', 'breakdown'] as const;
const PHASE_LABELS: Record<string, string> = { setup: '🔧 Setup', event: '🎉 Event', breakdown: '📦 Breakdown' };

function parseTime(t: string): number {
  const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export default function Schedule() {
  const { canManageSchedule } = useRole();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchSchedule = useCallback(async () => {
    const { data } = await supabase.from('schedule_slots').select('*').order('time');
    setSlots(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);
  useRealtimeSubscription('schedule_slots', fetchSchedule);

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <ContextualTooltip screen="schedule" />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Master Schedule</h1>
        {canManageSchedule && (
          <button onClick={() => setShowCreate(true)} className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <Plus size={16} /> Add Slot
          </button>
        )}
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto mb-3 text-muted-foreground" size={40} />
          <p className="text-lg font-medium text-muted-foreground">No schedule slots yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add schedule slots to plan the event timeline</p>
          {canManageSchedule && (
            <button onClick={() => setShowCreate(true)} className="mt-4 gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
              Add First Slot
            </button>
          )}
        </div>
      ) : (
        PHASES.map((phase) => {
          const phaseSlots = slots.filter(s => s.phase === phase).sort((a, b) => parseTime(a.time) - parseTime(b.time));
          if (phaseSlots.length === 0) return null;
          return (
            <div key={phase}>
              <h2 className="text-lg font-semibold mb-3">{PHASE_LABELS[phase]}</h2>
              <div className="space-y-2">
                {phaseSlots.map((slot) => (
                  <div key={slot.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <span className="font-mono text-sm font-bold whitespace-nowrap">{slot.time}</span>
                      {slot.end_time && <span className="text-xs text-muted-foreground">– {slot.end_time}</span>}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{slot.activity}</p>
                      {slot.location && <p className="text-xs text-muted-foreground">{slot.location}</p>}
                      {slot.notes && <p className="text-xs text-muted-foreground mt-0.5">{slot.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ZoneBadge zone={slot.zone} />
                      {slot.roles?.map((r: string) => (
                        <span key={r} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {showCreate && <CreateSlotModal onClose={() => setShowCreate(false)} onCreated={() => supabase.from('schedule_slots').select('*').order('time').then(({ data }) => setSlots(data || []))} />}
    </div>
  );
}

function CreateSlotModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activity, setActivity] = useState('');
  const [location, setLocation] = useState('');
  const [zone, setZone] = useState('General');
  const [phase, setPhase] = useState<string>('event');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !activity) return;
    setSaving(true);
    await supabase.from('schedule_slots').insert({ time, end_time: endTime || null, activity, location, zone, phase: phase as any, notes });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Add Schedule Slot</h2><button type="button" onClick={onClose}><X size={20} /></button></div>
          <div className="grid grid-cols-2 gap-3">
            <input value={time} onChange={e => setTime(e.target.value)} placeholder="Start time (e.g. 9:00 AM)" required className="border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            <input value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="End time (optional)" className="border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
          <input value={activity} onChange={e => setActivity(e.target.value)} placeholder="Activity" required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <div className="grid grid-cols-2 gap-3">
            <select value={zone} onChange={e => setZone(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-sm bg-background">
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <select value={phase} onChange={e => setPhase(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-sm bg-background">
              <option value="setup">Setup</option><option value="event">Event</option><option value="breakdown">Breakdown</option>
            </select>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-16 resize-none" />
          <button type="submit" disabled={saving} className="w-full gradient-primary text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Add Slot'}</button>
        </form>
      </div>
    </>
  );
}
