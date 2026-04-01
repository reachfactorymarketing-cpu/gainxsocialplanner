import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { RoleBadge } from '@/components/Badges';

export default function ProfileSettingsModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id);
    setUser({ ...user, name: name.trim() });
    setMsg('Profile updated!');
    setSaving(false);
    setTimeout(() => setMsg(''), 2000);
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { setPwMsg('Passwords do not match'); return; }
    if (newPassword.length < 6) { setPwMsg('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    setPwMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPwMsg(error.message); } else { setPwMsg('Password updated!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
    setSavingPw(false);
    setTimeout(() => setPwMsg(''), 3000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 overflow-y-auto animate-slide-in-right">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Profile Settings</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 space-y-6">
          {/* Profile Info */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold" style={{ background: user?.avatar_url ? 'none' : 'linear-gradient(135deg, #7C3AED, #F97316)', color: 'white' }}>
              {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : (user?.name || 'G')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <RoleBadge role={user?.role || 'guest'} />
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Edit Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            <button onClick={saveName} disabled={saving} className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Name'}
            </button>
            {msg && <p className="text-xs text-green-600">{msg}</p>}
          </div>

          {/* Change Password */}
          <div className="space-y-2 border-t border-border pt-4">
            <h3 className="text-sm font-medium">Change Password</h3>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            <button onClick={changePassword} disabled={savingPw} className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {savingPw ? 'Updating...' : 'Save Password'}
            </button>
            {pwMsg && <p className={`text-xs ${pwMsg.includes('updated') ? 'text-green-600' : 'text-destructive'}`}>{pwMsg}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
