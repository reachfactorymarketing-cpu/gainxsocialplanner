import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { RoleBadge, ZoneBadge } from '@/components/Badges';
import { Search, UserPlus, X, Edit2, Users } from 'lucide-react';
import { ZONES, ROLE_LABELS, type AppRole } from '@/lib/constants';
import { ContextualTooltip } from '@/components/ContextualTooltip';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { usePresence } from '@/hooks/usePresence';

const ROLES: AppRole[] = ['admin', 'zone_lead', 'volunteer', 'instructor', 'vendor', 'reset_space_partner'];

export default function People() {
  const { user } = useAuthStore();
  const { isAdmin } = useRole();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editPerson, setEditPerson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { onlineUsers, isOnline } = usePresence();

  const fetchData = async () => {
    const [pRes, tRes] = await Promise.all([
      supabase.from('profiles').select('*').order('name'),
      supabase.from('tasks').select('id, assignee_id, status'),
    ]);
    setProfiles(pRes.data || []);
    setTasks(tRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useRealtimeSubscription('profiles', fetchData);
  useRealtimeSubscription('tasks', fetchData);

  const filtered = profiles.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  const getTaskStats = (userId: string) => {
    const userTasks = tasks.filter(t => t.assignee_id === userId);
    const done = userTasks.filter(t => t.status === 'Done').length;
    return { total: userTasks.length, done, pct: userTasks.length ? Math.round((done / userTasks.length) * 100) : 0 };
  };

  const canEdit = (personId: string) => isAdmin || personId === user?.id;

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <ContextualTooltip screen="people" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">People & Roles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
            {onlineUsers.length} online
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <UserPlus size={16} /> Add Person
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..." className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="mx-auto mb-3 text-muted-foreground" size={40} />
          <p className="text-muted-foreground text-sm">No team members found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const stats = getTaskStats(p.id);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold shrink-0" style={{ background: p.avatar_url ? 'none' : 'linear-gradient(135deg, #7C3AED, #F97316)', color: 'white' }}>
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : p.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RoleBadge role={p.role} />
                    <ZoneBadge zone={p.zone} />
                    {p.status === 'inactive' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{stats.done}/{stats.total} tasks</p>
                    <div className="w-24 h-2 bg-muted rounded-full mt-1">
                      <div className="h-full rounded-full transition-all" style={{ width: `${stats.pct}%`, background: 'linear-gradient(135deg, #7C3AED, #F97316)' }} />
                    </div>
                  </div>
                  {canEdit(p.id) && (
                    <button onClick={() => setEditPerson(p)} className="p-2 rounded-lg hover:bg-accent transition text-muted-foreground hover:text-foreground">
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editPerson && <EditPersonModal person={editPerson} onClose={() => setEditPerson(null)} onSaved={fetchData} isAdmin={isAdmin} />}
      {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} onCreated={fetchData} />}
    </div>
  );
}

function EditPersonModal({ person, onClose, onSaved, isAdmin }: { person: any; onClose: () => void; onSaved: () => void; isAdmin: boolean }) {
  const [name, setName] = useState(person.name || '');
  const [role, setRole] = useState<AppRole>(person.role || 'volunteer');
  const [zone, setZone] = useState(person.zone || 'General');
  const [status, setStatus] = useState(person.status || 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const updates: any = { name, zone, status };
    if (isAdmin) {
      updates.role = role;
    }
    const { error: err } = await supabase.from('profiles').update(updates).eq('id', person.id);
    if (err) { setError(err.message); setSaving(false); return; }
    if (isAdmin) {
      await supabase.from('user_roles').upsert({ user_id: person.id, role: role as any }, { onConflict: 'user_id,role' });
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Edit Team Member</h2><button type="button" onClick={onClose}><X size={20} /></button></div>
          {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input value={person.email} disabled className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-muted cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <select value={role} onChange={e => setRole(e.target.value as AppRole)} disabled={!isAdmin} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background disabled:bg-muted">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Zone</label>
              <select value={zone} onChange={e => setZone(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} disabled={!isAdmin} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background disabled:bg-muted">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="w-full gradient-primary text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </>
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
          <button type="submit" disabled={saving} className="w-full gradient-primary text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">{saving ? 'Creating...' : 'Add Person'}</button>
        </form>
      </div>
    </>
  );
}
