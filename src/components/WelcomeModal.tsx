import { useState } from 'react';
import { X, CheckCircle2, Circle, Rocket, Users, ClipboardList, Megaphone, Calendar, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore, type Profile } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { RoleBadge } from '@/components/Badges';
import { EVENT_NAME, EVENT_DATE } from '@/lib/constants';

const ROLE_TIPS: Record<string, { icon: React.ReactNode; tips: string[] }> = {
  admin: {
    icon: <Rocket size={20} />,
    tips: [
      'You have full access to all features and settings.',
      'Add team members in People & Roles.',
      'Create and assign tasks on the Task Board.',
      'Post announcements to keep everyone informed.',
      'Monitor progress in the Reports dashboard.',
    ],
  },
  zone_lead: {
    icon: <Users size={20} />,
    tips: [
      'You manage tasks and volunteers in your zone.',
      'Check the Task Board daily for updates.',
      'Use Chat to coordinate with your team.',
      'Review the Schedule for your zone\'s timeline.',
    ],
  },
  volunteer: {
    icon: <ClipboardList size={20} />,
    tips: [
      'Check your assigned tasks on the Dashboard.',
      'Mark tasks complete as you finish them.',
      'Use Chat to ask questions or share updates.',
      'Review the Schedule to know your shifts.',
    ],
  },
  instructor: {
    icon: <Calendar size={20} />,
    tips: [
      'Review your scheduled sessions in Schedule.',
      'Check Documents for class plans and guides.',
      'Coordinate with Zone Leads via Chat.',
    ],
  },
  vendor: {
    icon: <ClipboardList size={20} />,
    tips: [
      'Check your booth assignment in Vendors.',
      'Review load-in times and setup instructions.',
      'Contact the team via Chat for any questions.',
    ],
  },
  reset_space_partner: {
    icon: <Users size={20} />,
    tips: [
      'Your Reset Space zone has dedicated tasks.',
      'Coordinate setup with your Zone Lead.',
      'Check Schedule for your session times.',
    ],
  },
  guest: {
    icon: <Eye size={20} />,
    tips: [
      'You\'re viewing in read-only mode.',
      'Sign up for a full account to participate.',
      'Browse tasks, schedule, and announcements.',
    ],
  },
};

interface ChecklistItem {
  id: string;
  label: string;
  route: string;
}

const ADMIN_CHECKLIST: ChecklistItem[] = [
  { id: 'people', label: 'Add team members', route: '/people' },
  { id: 'tasks', label: 'Create your first task', route: '/tasks' },
  { id: 'announce', label: 'Post an announcement', route: '/announcements' },
  { id: 'schedule', label: 'Set up the schedule', route: '/schedule' },
];

const MEMBER_CHECKLIST: ChecklistItem[] = [
  { id: 'dashboard', label: 'Review your dashboard', route: '/' },
  { id: 'tasks', label: 'Check your assigned tasks', route: '/tasks' },
  { id: 'schedule', label: 'View the event schedule', route: '/schedule' },
  { id: 'chat', label: 'Say hello in Chat', route: '/chat' },
];

export default function WelcomeModal({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuthStore();
  const { role, isAdmin } = useRole();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const roleTips = ROLE_TIPS[role] || ROLE_TIPS.guest;
  const checklist = isAdmin ? ADMIN_CHECKLIST : MEMBER_CHECKLIST;

  const handleDismiss = async () => {
    if (user) {
      await supabase.from('profiles').update({ has_seen_welcome: true }).eq('id', user.id);
      setUser({ ...user, has_seen_welcome: true } as Profile);
    }
    onClose();
  };

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleDismiss} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F97316 100%)' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black">Welcome to {EVENT_NAME}! 🎉</h2>
              <button onClick={handleDismiss} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-sm text-white/90">Event date: {new Date(EVENT_DATE).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <div className="mt-2"><RoleBadge role={role} /></div>
          </div>

          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Role Tips */}
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                {roleTips.icon} Tips for your role
              </h3>
              <ul className="space-y-1.5">
                {roleTips.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Getting Started Checklist */}
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <Rocket size={16} /> Getting Started
              </h3>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-accent/50 transition text-left"
                  >
                    {checked.has(item.id) ? (
                      <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground shrink-0" />
                    )}
                    <span className={`text-sm ${checked.has(item.id) ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleDismiss}
              className="w-full gradient-primary text-white rounded-lg py-2.5 text-sm font-bold"
            >
              Let's Go! 🚀
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
