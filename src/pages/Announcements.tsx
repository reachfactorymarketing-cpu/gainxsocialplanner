import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Megaphone, Plus, Trash2, X, Eye } from 'lucide-react';

export default function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
    const channel = supabase.channel('announcements-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchAnnouncements)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('announcements').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchAnnouncements();
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><Megaphone size={22} /> Announcements</h1>
        <button onClick={() => setShowCreate(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">No announcements yet</p>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{a.audience}</span>
                  </div>
                </div>
                <button onClick={() => setDeleteId(a.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateAnnouncementModal onClose={() => setShowCreate(false)} onCreated={fetchAnnouncements} userId={user?.id} />}

      {/* Delete Confirmation */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border border-border shadow-lg w-full max-w-sm p-6 space-y-4 text-center">
              <p className="font-semibold">Delete this announcement?</p>
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-border rounded-lg text-sm">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium">Delete</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CreateAnnouncementModal({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId?: string }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('announcements').insert({ title, body, audience, author_id: userId });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md p-6 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">New Announcement</h2><button type="button" onClick={onClose}><X size={20} /></button></div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Announcement body" required className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-24 resize-none" />
          <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background">
            <option value="all">All Team</option>
            <option value="admin">Admin Only</option>
            <option value="zone_lead">Zone Leads</option>
            <option value="volunteer">Volunteers</option>
          </select>
          <button type="submit" disabled={saving} className="w-full gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">{saving ? 'Posting...' : 'Post Announcement'}</button>
        </form>
      </div>
    </>
  );
}
