import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { StatusBadge } from '@/components/Badges';
import { Plus, X, Store } from 'lucide-react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { toast } from 'sonner';

export default function Vendors() {
  const { user } = useAuthStore();
  const { isAdmin, isVendor } = useRole();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchVendors = useCallback(async () => {
    let query = supabase.from('vendors').select('*').order('name');
    if (isVendor && user?.id) query = query.eq('user_id', user.id);
    const { data } = await query;
    setVendors(data || []);
    setLoading(false);
  }, [isVendor, user?.id]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useRealtimeSubscription('vendors', fetchVendors);

  const confirmStatus = async (vendorId: string, field: string) => {
    await supabase.from('vendors').update({ [field]: 'confirmed' }).eq('id', vendorId);
    toast.success('Status confirmed!');
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><Store size={22} /> Vendor Portal</h1>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <Plus size={16} /> Add Vendor
          </button>
        )}
      </div>

      {vendors.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">No vendors added yet</p>
      ) : (
        <div className="space-y-3">
          {vendors.map(v => {
            const canEdit = isAdmin || (isVendor && v.user_id === user?.id);
            return (
              <div key={v.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{v.name}</h3>
                    <p className="text-sm text-muted-foreground">{v.category} · {v.booth_location}</p>
                    {v.load_in_time && <p className="text-xs text-muted-foreground mt-0.5">Load-in: {v.load_in_time}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Freebie: </span>
                      <StatusBadge status={v.freebie_status} />
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Raffle: </span>
                      <StatusBadge status={v.raffle_status} />
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Agreement: </span>
                      <StatusBadge status={v.agreement_status} />
                    </div>
                  </div>
                </div>
                {canEdit && (v.freebie_status === 'pending' || v.raffle_status === 'pending') && (
                  <div className="flex gap-2 mt-3">
                    {v.freebie_status === 'pending' && (
                      <button onClick={() => confirmStatus(v.id, 'freebie_status')} className="px-3 py-1.5 bg-gainx-emerald text-primary-foreground rounded-lg text-xs font-medium">Confirm Freebie</button>
                    )}
                    {v.raffle_status === 'pending' && (
                      <button onClick={() => confirmStatus(v.id, 'raffle_status')} className="px-3 py-1.5 bg-gainx-emerald text-primary-foreground rounded-lg text-xs font-medium">Confirm Raffle</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddVendorModal onClose={() => setShowAdd(false)} onCreated={fetchVendors} />}
    </div>
  );
}

function AddVendorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [booth, setBooth] = useState('');
  const [loadIn, setLoadIn] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('vendors').insert({ name, category, booth_location: booth, load_in_time: loadIn });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Add Vendor</h2><button type="button" onClick={onClose}><X size={20} /></button></div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Vendor name" required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. Apparel)" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <input value={booth} onChange={e => setBooth(e.target.value)} placeholder="Booth location" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <input value={loadIn} onChange={e => setLoadIn(e.target.value)} placeholder="Load-in time" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Add Vendor'}</button>
        </form>
      </div>
    </>
  );
}
