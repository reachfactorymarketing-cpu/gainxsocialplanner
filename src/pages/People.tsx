import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoleBadge, ZoneBadge } from '@/components/Badges';
import { Search, Plus, X, UserPlus } from 'lucide-react';
import { ZONES, ROLE_LABELS, type AppRole } from '@/lib/constants';

const ROLES: AppRole[] = ['admin', 'zone_lead', 'volunteer', 'instructor', 'vendor', 'reset_space_partner'];

export default function People() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').order('name'),
      supabase.from('tasks').select('id, assignee_id, status'),
    ]).then(([pRes, tRes]) => {
      setProfiles(pRes.data || []);
      setTasks(tRes.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = profiles.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()));

  const getTaskStats = (userId: string) => {
    const userTasks = tasks.filter(t => t.assignee_id === userId);
    const done = userTasks.filter(t => t.status === 'Done').length;
    return { total: userTasks.length, done, pct: userTasks.length ? Math.round((done / userTasks.length) * 100) : 0 };
  };

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">People & Roles</h1>
        <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
          <UserPlus size={16} /> Add Person
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..." className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground text-sm">No team members found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const stats = getTaskStats(p.id);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                  {p.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={p.role} />
                    <ZoneBadge zone={p.zone} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{stats.done}/{stats.total} tasks</p>
                  <div className="w-24 h-2 bg-muted rounded-full mt-1">
                    <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${stats.pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} onCreated={() => supabase.from('profiles').select('*').order('name').then(({ data }) => setProfiles(data || []))} />}
    </div>
  );
}

function AddPersonModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('volunteer');
  const [zone, setZone] = useState('General');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (signUpError) { setError(signUpError.message); setSaving(false); return; }
    if (data.user) {
      await supabase.from('profiles').update({ name, role: role as any, zone }).eq('id', data.user.id);
      await supabase.from('user_roles').insert({ user_id: data.user.id, role: role as any });
    }
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Add Team Member</h2><button type="button" onClick={onClose}><X size={20} /></button></div>
          {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</p>}
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <div className="grid grid-cols-2 gap-3">
            <select value={role} onChange={e => setRole(e.target.value as AppRole)} className="border border-input rounded-lg px-3 py-2 text-sm bg-background">
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <select value={zone} onChange={e => setZone(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-sm bg-background">
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">{saving ? 'Creating...' : 'Add Person'}</button>
        </form>
      </div>
    </>
  );
}
