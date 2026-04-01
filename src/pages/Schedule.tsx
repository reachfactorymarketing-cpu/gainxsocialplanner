import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/hooks/useRole';
import { ZoneBadge } from '@/components/Badges';
import { Plus, X } from 'lucide-react';
import { ZONES } from '@/lib/constants';

const PHASES = ['setup', 'event', 'breakdown'] as const;
const PHASE_LABELS: Record<string, string> = { setup: '🔧 Setup', event: '🎉 Event', breakdown: '📦 Breakdown' };

export default function Schedule() {
  const { canManageSchedule, isGuestRole } = useRole();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('schedule_slots').select('*').order('time');
      setSlots(data || []);
      setLoading(false);
    };
    fetch();
    const channel = supabase.channel('schedule-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_slots' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Master Schedule</h1>
        {canManageSchedule && (
          <button onClick={() => setShowCreate(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <Plus size={16} /> Add Slot
          </button>
        )}
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No schedule slots yet</p>
          <p className="text-sm mt-1">Add schedule slots to plan the event timeline</p>
        </div>
      ) : (
        PHASES.map((phase) => {
          const phaseSlots = slots.filter(s => s.phase === phase);
          if (phaseSlots.length === 0) return null;
          return (
            <div key={phase}>
              <h2 className="text-lg font-semibold mb-3">{PHASE_LABELS[phase]}</h2>
              <div className="space-y-2">
                {phaseSlots.map((slot) => (
                  <div key={slot.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
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
          <button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Add Slot'}</button>
        </form>
      </div>
    </>
  );
}
