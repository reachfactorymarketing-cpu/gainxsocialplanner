import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { ZONES } from '@/lib/constants';
import { ZoneBadge } from '@/components/Badges';
import {
  FileText, StickyNote, Search, Plus, Pin, X, Trash2,
  Star, Lock, ExternalLink, Image, Link, Copy, Check,
  Info, ChevronDown, ChevronUp, FolderOpen
} from 'lucide-react';
import { ContextualTooltip } from '@/components/ContextualTooltip';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { toast } from 'sonner';

const FOLDERS = ['All', 'Marketing', 'Operations', 'Vendors', 'Finance', 'Creative', 'Templates'];
const STICKY_COLORS = ['#FDE68A', '#FBCFE8', '#BBF7D0', '#BFDBFE', '#DDD6FE', '#FED7AA', '#E5E7EB', '#FECACA'];

const FOLDER_COLORS: Record<string, { pill: string; active: string; unselected: string }> = {
  All: { pill: '', active: 'bg-gradient-to-r from-[#7C3AED] to-[#F97316] text-white', unselected: 'bg-white text-gray-600 border border-gray-300' },
  Marketing: { pill: 'bg-purple-100 text-purple-700 border border-purple-200', active: 'bg-purple-600 text-white', unselected: 'bg-white text-purple-700 border border-purple-200' },
  Operations: { pill: 'bg-teal-100 text-teal-700 border border-teal-200', active: 'bg-teal-600 text-white', unselected: 'bg-white text-teal-700 border border-teal-200' },
  Vendors: { pill: 'bg-orange-100 text-orange-700 border border-orange-200', active: 'bg-orange-600 text-white', unselected: 'bg-white text-orange-700 border border-orange-200' },
  Finance: { pill: 'bg-green-100 text-green-700 border border-green-200', active: 'bg-green-600 text-white', unselected: 'bg-white text-green-700 border border-green-200' },
  Creative: { pill: 'bg-pink-100 text-pink-700 border border-pink-200', active: 'bg-pink-600 text-white', unselected: 'bg-white text-pink-700 border border-pink-200' },
  Templates: { pill: 'bg-gray-100 text-gray-600 border border-gray-200', active: 'bg-gray-600 text-white', unselected: 'bg-white text-gray-600 border border-gray-200' },
};

const GOOGLE_BADGES: Record<string, { label: string; cls: string }> = {
  doc: { label: 'Doc', cls: 'bg-blue-100 text-blue-700' },
  sheet: { label: 'Sheet', cls: 'bg-green-100 text-green-700' },
  slides: { label: 'Slides', cls: 'bg-yellow-100 text-yellow-700' },
  drive: { label: 'Drive', cls: 'bg-gray-100 text-gray-600' },
};

function detectGoogleType(url: string): string | null {
  if (!url) return null;
  if (url.includes('docs.google.com/document')) return 'doc';
  if (url.includes('docs.google.com/spreadsheets')) return 'sheet';
  if (url.includes('docs.google.com/presentation')) return 'slides';
  if (url.includes('drive.google.com')) return 'drive';
  return null;
}

function getDocIcon(type: string) {
  switch (type) {
    case 'external_link': return <ExternalLink size={16} className="text-gray-400 shrink-0" />;
    case 'image': return <Image size={16} className="text-gray-400 shrink-0" />;
    case 'google_file': return <Link size={16} className="text-gray-400 shrink-0" />;
    default: return <FileText size={16} className="text-gray-400 shrink-0" />;
  }
}

const ZONE_PILL_COLORS: Record<string, { active: string; inactive: string }> = {
  All: { active: 'bg-gradient-to-r from-[#7C3AED] to-[#F97316] text-white', inactive: 'bg-white text-gray-600 border border-gray-300' },
  'Move Floor': { active: 'bg-purple-600 text-white', inactive: 'bg-white text-purple-700 border border-purple-200' },
  'Reset Space': { active: 'bg-teal-600 text-white', inactive: 'bg-white text-teal-700 border border-teal-200' },
  'Link-Up': { active: 'bg-amber-600 text-white', inactive: 'bg-white text-amber-700 border border-amber-200' },
  'Vendor Row': { active: 'bg-orange-600 text-white', inactive: 'bg-white text-orange-700 border border-orange-200' },
  General: { active: 'bg-gray-600 text-white', inactive: 'bg-white text-gray-600 border border-gray-200' },
};

export default function Documents() {
  const [tab, setTab] = useState<'documents' | 'brainstorm'>('documents');

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Document Hub</h1>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <button onClick={() => setTab('documents')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === 'documents' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
            <FileText size={14} className="inline mr-1 text-gray-400" /> Documents
          </button>
          <button onClick={() => setTab('brainstorm')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === 'brainstorm' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
            <StickyNote size={14} className="inline mr-1 text-gray-400" /> Brainstorm
          </button>
        </div>
      </div>
      {tab === 'documents' ? <DocumentsTab /> : <BrainstormTab />}
    </div>
  );
}

/* ───────── CREATE / EDIT MODAL ───────── */
function CreateDocModal({ open, onClose, onSaved, editDoc }: { open: boolean; onClose: () => void; onSaved: () => void; editDoc?: any }) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState(editDoc?.title || '');
  const [folder, setFolder] = useState(editDoc?.folder || 'Operations');
  const [type, setType] = useState(editDoc?.type || 'richtext');
  const [content, setContent] = useState(editDoc?.content || '');
  const [perms, setPerms] = useState(editDoc?.permissions_level || 'all');
  const [pinned, setPinned] = useState(editDoc?.pinned || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editDoc) {
      setTitle(editDoc.title); setFolder(editDoc.folder); setType(editDoc.type);
      setContent(editDoc.content || ''); setPerms(editDoc.permissions_level); setPinned(editDoc.pinned);
    } else {
      setTitle(''); setFolder('Operations'); setType('richtext'); setContent(''); setPerms('all'); setPinned(false);
    }
  }, [editDoc, open]);

  if (!open) return null;

  const googleType = type === 'google_file' ? detectGoogleType(content) : null;

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const payload = { title, folder, type, content, permissions_level: perms, pinned, created_by: user?.id };
    if (editDoc) {
      await supabase.from('documents').update(payload).eq('id', editDoc.id);
    } else {
      await supabase.from('documents').insert(payload);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-lg">{editDoc ? 'Edit Document' : 'Add Document'}</h2>
            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Document title" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'richtext', label: 'Rich Text', icon: '📝' },
                  { val: 'external_link', label: 'External Link', icon: '🔗' },
                  { val: 'image', label: 'Image', icon: '🖼️' },
                  { val: 'google_file', label: 'Google File', icon: '🔵' },
                ].map(t => (
                  <button key={t.val} onClick={() => setType(t.val)}
                    className={`px-3 py-2 rounded-lg text-sm border text-left ${type === t.val ? 'border-purple-500 bg-purple-50 font-semibold' : 'border-gray-200'}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Folder</label>
              <select value={folder} onChange={e => setFolder(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {FOLDERS.filter(f => f !== 'All').map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {type === 'google_file' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Paste your Google link</label>
                  <input value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="https://docs.google.com/..." />
                </div>
                {content && (
                  <div className="text-sm">
                    {googleType ? (
                      <span className="text-green-600 flex items-center gap-1"><Check size={14} className="text-gray-400" /> Google {GOOGLE_BADGES[googleType].label} detected</span>
                    ) : (
                      <span className="text-amber-600">Please paste a valid Google link</span>
                    )}
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Make sure sharing is enabled</p>
                      <p className="text-xs text-blue-600 mt-0.5">In Google, click Share → 'Anyone with the link can view' so your team can open it.</p>
                    </div>
                  </div>
                </div>
                {content && googleType && (
                  <button onClick={() => window.open(content, '_blank')} className="text-sm text-purple-600 hover:underline">Test link →</button>
                )}
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  {type === 'external_link' ? 'URL' : type === 'image' ? 'Image URL' : 'Content'}
                </label>
                {type === 'richtext' ? (
                  <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Document content..." />
                ) : (
                  <input value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder={type === 'image' ? 'https://...' : 'https://...'} />
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-1">Access</label>
                <select value={perms} onChange={e => setPerms(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="all">All Roles</option>
                  <option value="admin">Admin Only</option>
                  <option value="zone_lead">Zone Leads+</option>
                </select>
              </div>
              <label className="flex items-center gap-2 pt-5 cursor-pointer">
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="accent-purple-600" />
                <span className="text-sm text-gray-600">Pin</span>
              </label>
            </div>
          </div>
          <div className="p-5 border-t border-gray-200 flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
            <button onClick={save} disabled={saving || !title.trim()} className="px-4 py-2 text-sm rounded-lg text-white font-medium gradient-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ───────── DOCUMENTS TAB ───────── */
function DocumentsTab() {
  const { canManageDocuments } = useRole();
  const { user } = useAuthStore();
  const [docs, setDocs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [folder, setFolder] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editDoc, setEditDoc] = useState<any | null>(null);
  const [tipDismissed, setTipDismissed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setTipDismissed(!!localStorage.getItem(`docHubTipDismissed_${user.id}`));
    }
  }, [user]);

  const dismissTip = () => {
    if (user) localStorage.setItem(`docHubTipDismissed_${user.id}`, 'true');
    setTipDismissed(true);
  };

  const fetchDocs = useCallback(async () => {
    const { data } = await supabase.from('documents').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocs();
    supabase.from('profiles').select('id, name, avatar_url').then(({ data }) => setProfiles(data || []));
  }, [fetchDocs]);

  useRealtimeSubscription('documents', fetchDocs);

  const getProfile = (id: string) => profiles.find(p => p.id === id);

  const filtered = docs
    .filter(d => folder === 'All' || d.folder === folder)
    .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.content?.toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter(d => d.pinned);
  const unpinned = filtered.filter(d => !d.pinned);

  const copyLink = (doc: any) => {
    const link = doc.type === 'google_file' || doc.type === 'external_link' ? doc.content : `${window.location.origin}/documents`;
    navigator.clipboard.writeText(link || window.location.href);
    setCopiedId(doc.id);
    toast.success('Link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <ContextualTooltip screen="documents" />

      {!tipDismissed && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-xl p-4 flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm text-gray-800">💡 Tip: Link your Google files</p>
            <p className="text-xs text-gray-600 mt-0.5">Paste any Google Doc, Sheet, Slides, or Drive folder link to add it to your document library. Your team can open it directly from here.</p>
          </div>
          <button onClick={dismissTip} className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap ml-4">Got it</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {FOLDERS.map(f => (
            <button key={f} onClick={() => setFolder(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${folder === f ? FOLDER_COLORS[f].active : FOLDER_COLORS[f].unselected}`}>{f}</button>
          ))}
        </div>
        {canManageDocuments && (
          <button onClick={() => { setEditDoc(null); setShowCreate(true); }} className="gradient-primary text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
            <Plus size={14} /> Add Document
          </button>
        )}
      </div>

      {pinned.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1 text-gray-500"><Pin size={14} className="text-gray-400" /> Pinned</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {pinned.map(doc => <DocCard key={doc.id} doc={doc} profile={getProfile(doc.created_by)} onClick={() => setSelectedDoc(doc)} onCopy={() => copyLink(doc)} copied={copiedId === doc.id} />)}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {unpinned.map(doc => <DocCard key={doc.id} doc={doc} profile={getProfile(doc.created_by)} onClick={() => setSelectedDoc(doc)} onCopy={() => copyLink(doc)} copied={copiedId === doc.id} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No documents in {folder === 'All' ? 'any folder' : folder} yet</p>
          <p className="text-xs text-gray-400 mt-1">Add a document or paste a Google link to get started.</p>
          {canManageDocuments && (
            <button onClick={() => { setEditDoc(null); setShowCreate(true); }} className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 inline-flex items-center gap-1">
              <Plus size={14} /> Add Document
            </button>
          )}
        </div>
      )}

      {/* Document Drawer */}
      {selectedDoc && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedDoc(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white border-l border-gray-200 z-50 overflow-y-auto animate-slide-in-right">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getDocIcon(selectedDoc.type)}
                <h2 className="font-bold text-gray-900">{selectedDoc.title}</h2>
              </div>
              <button onClick={() => setSelectedDoc(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <FolderBadge folder={selectedDoc.folder} />
                {selectedDoc.type === 'google_file' && detectGoogleType(selectedDoc.content || '') && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${GOOGLE_BADGES[detectGoogleType(selectedDoc.content || '')!].cls}`}>
                    {GOOGLE_BADGES[detectGoogleType(selectedDoc.content || '')!].label}
                  </span>
                )}
                {selectedDoc.permissions_level !== 'all' && (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                    <Lock size={10} /> {selectedDoc.permissions_level}
                  </span>
                )}
              </div>

              {selectedDoc.type === 'google_file' ? (
                <div className="space-y-3">
                  <button onClick={() => window.open(selectedDoc.content, '_blank')} className="w-full gradient-primary text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    Open in Google →
                  </button>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-600">Make sure sharing is set to 'Anyone with the link can view' in Google.</p>
                  </div>
                  <div className="text-sm space-y-2 text-gray-500">
                    {selectedDoc.created_by && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Added by:</span>
                        <span className="font-medium text-gray-700">{getProfile(selectedDoc.created_by)?.name || 'Unknown'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-gray-700">{new Date(selectedDoc.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Link:</span>
                      <span className="text-gray-700 truncate flex-1 text-xs">{selectedDoc.content}</span>
                      <button onClick={() => { navigator.clipboard.writeText(selectedDoc.content || ''); toast.success('Link copied!'); }}>
                        <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: selectedDoc.content || '<p class="text-gray-400">No content</p>' }} />
              )}
            </div>
          </div>
        </>
      )}

      <CreateDocModal open={showCreate} onClose={() => { setShowCreate(false); setEditDoc(null); }} onSaved={fetchDocs} editDoc={editDoc} />
    </div>
  );
}

/* ───────── FOLDER BADGE ───────── */
function FolderBadge({ folder }: { folder: string }) {
  const cls = FOLDER_COLORS[folder]?.pill || 'bg-gray-100 text-gray-600 border border-gray-200';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{folder}</span>;
}

/* ───────── DOC CARD ───────── */
function DocCard({ doc, profile, onClick, onCopy, copied }: { doc: any; profile?: any; onClick: () => void; onCopy: () => void; copied: boolean }) {
  const googleType = doc.type === 'google_file' ? detectGoogleType(doc.content || '') : null;

  return (
    <div onClick={onClick} className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group relative">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {getDocIcon(doc.type)}
          <p className="text-sm font-semibold text-gray-900 truncate">{doc.title}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button onClick={e => { e.stopPropagation(); onCopy(); }} className="opacity-0 group-hover:opacity-100 transition" title="Copy link">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400 hover:text-gray-600" />}
          </button>
          {doc.pinned && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
          {doc.permissions_level !== 'all' && <Lock size={14} className="text-gray-400" />}
        </div>
      </div>

      {/* Middle row — badges */}
      <div className="flex items-center gap-1.5 mt-2">
        <FolderBadge folder={doc.folder} />
        {googleType && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${GOOGLE_BADGES[googleType].cls}`}>
            {GOOGLE_BADGES[googleType].label}
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {profile ? (
            <>
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 overflow-hidden">
                {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : profile.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-xs text-gray-400 truncate">{profile.name}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{new Date(doc.updated_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

/* ───────── BRAINSTORM TAB ───────── */
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

  if (loading) return <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        {['All', ...ZONES].map(z => {
          const colors = ZONE_PILL_COLORS[z] || ZONE_PILL_COLORS.General;
          return (
            <button key={z} onClick={() => setZone(z)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${zone === z ? colors.active : colors.inactive}`}>{z}</button>
          );
        })}
        {!isGuestRole && (
          <button onClick={addNote} className="gradient-primary text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1"><Plus size={14} /> Add Note</button>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No brainstorm notes yet</p>
          <p className="text-xs text-gray-400 mt-1">Drop an idea to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(note => (
            <div key={note.id} className="rounded-lg p-3 min-h-[120px] relative group" style={{ backgroundColor: note.color }}>
              <p className="text-sm font-semibold text-gray-900">{note.title}</p>
              <p className="text-xs text-gray-700 mt-1">{note.body}</p>
              <ZoneBadge zone={note.zone} />
              {!isGuestRole && (
                <button onClick={() => deleteNote(note.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
