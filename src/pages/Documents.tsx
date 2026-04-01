import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { ZONES } from '@/lib/constants';
import { ZoneBadge } from '@/components/Badges';
import { FileText, StickyNote, Search, Plus, Pin, X, Trash2 } from 'lucide-react';
import { ContextualTooltip } from '@/components/ContextualTooltip';

const FOLDERS = ['All', 'Marketing', 'Operations', 'Vendors', 'Finance', 'Templates'];
const STICKY_COLORS = ['#FDE68A', '#FBCFE8', '#BBF7D0', '#BFDBFE', '#DDD6FE', '#FED7AA', '#E5E7EB', '#FECACA'];

export default function Documents() {
  const [tab, setTab] = useState<'documents' | 'brainstorm'>('documents');

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Document Hub</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setTab('documents')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === 'documents' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
            <FileText size={14} className="inline mr-1" /> Documents
          </button>
          <button onClick={() => setTab('brainstorm')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === 'brainstorm' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
            <StickyNote size={14} className="inline mr-1" /> Brainstorm
          </button>
        </div>
      </div>
      {tab === 'documents' ? <DocumentsTab /> : <BrainstormTab />}
    </div>
  );
}

function DocumentsTab() {
  const { canManageDocuments } = useRole();
  const [docs, setDocs] = useState<any[]>([]);
  const [folder, setFolder] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('documents').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false }).then(({ data }) => {
      setDocs(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = docs
    .filter(d => folder === 'All' || d.folder === folder)
    .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.content?.toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter(d => d.pinned);
  const unpinned = filtered.filter(d => !d.pinned);

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {FOLDERS.map(f => (
            <button key={f} onClick={() => setFolder(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${folder === f ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{f}</button>
          ))}
        </div>
      </div>

      {pinned.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><Pin size={14} /> Pinned</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {pinned.map(doc => <DocCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} />)}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        {unpinned.map(doc => <DocCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} />)}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No documents found</p>}

      {selectedDoc && (
        <>
          <div className="fixed inset-0 bg-foreground/20 z-40" onClick={() => setSelectedDoc(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{selectedDoc.title}</h2>
              <button onClick={() => setSelectedDoc(null)}><X size={20} /></button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <span className="text-xs bg-muted px-2 py-1 rounded-full">{selectedDoc.folder}</span>
                {selectedDoc.permissions_level !== 'all' && <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">{selectedDoc.permissions_level}</span>}
              </div>
              <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: selectedDoc.content || '<p>No content</p>' }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DocCard({ doc, onClick }: { doc: any; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:shadow-md transition">
      <div className="flex items-center gap-2">
        {doc.pinned && <Pin size={12} className="text-primary" />}
        <p className="text-sm font-medium flex-1">{doc.title}</p>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs text-muted-foreground">{doc.folder}</span>
        {doc.permissions_level !== 'all' && <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Restricted</span>}
      </div>
    </div>
  );
}

function BrainstormTab() {
  const { isGuestRole } = useRole();
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [zone, setZone] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('brainstorm_notes').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setNotes(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = zone === 'All' ? notes : notes.filter(n => n.zone === zone);

  const addNote = async () => {
    if (!user) return;
    const { data } = await supabase.from('brainstorm_notes').insert({
      zone: zone === 'All' ? 'General' : zone,
      title: 'New Idea',
      body: '',
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
      author_id: user.id,
    }).select().single();
    if (data) setNotes(prev => [data, ...prev]);
  };

  const deleteNote = async (id: string) => {
    await supabase.from('brainstorm_notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        {['All', ...ZONES].map(z => (
          <button key={z} onClick={() => setZone(z)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${zone === z ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{z}</button>
        ))}
        {!isGuestRole && (
          <button onClick={addNote} className="gradient-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1"><Plus size={14} /> Add Note</button>
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No brainstorm notes yet</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(note => (
            <div key={note.id} className="rounded-lg p-3 min-h-[120px] relative group" style={{ backgroundColor: note.color }}>
              <p className="text-sm font-semibold text-foreground">{note.title}</p>
              <p className="text-xs text-foreground/70 mt-1">{note.body}</p>
              <ZoneBadge zone={note.zone} />
              {!isGuestRole && (
                <button onClick={() => deleteNote(note.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 size={14} className="text-destructive" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
