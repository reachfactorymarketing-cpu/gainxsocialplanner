import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface TooltipConfig {
  label: string;
  text: string;
  roles?: string[]; // only show for these roles; undefined = all
}

const TOOLTIPS: Record<string, TooltipConfig> = {
  tasks: {
    label: 'Drag cards to update progress',
    text: 'Move cards between columns as work progresses toward the event.',
  },
  schedule: {
    label: 'Your call time is highlighted',
    text: 'Slots matching your role have a purple border — those are yours.',
  },
  documents: {
    label: 'Pinned docs are must-reads',
    text: 'Start with pinned documents — they contain the most important event info.',
  },
  chat: {
    label: 'Stay in your zone channel',
    text: 'You only see channels for your zone plus #all-hands for event-wide updates.',
  },
  people: {
    label: 'Manage your whole team here',
    text: 'Add people, assign roles, and transfer responsibilities if needed.',
    roles: ['admin'],
  },
  reports: {
    label: 'Track progress daily',
    text: 'Zone bars and team table update live as tasks are completed.',
    roles: ['admin'],
  },
};

export function ContextualTooltip({ screen }: { screen: string }) {
  const user = useAuthStore(s => s.user);
  const [visible, setVisible] = useState(false);

  const config = TOOLTIPS[screen];

  useEffect(() => {
    if (!config || !user) return;
    // Check role restriction
    if (config.roles && !config.roles.includes(user.role)) return;
    const key = `tooltip_seen_${user.id}_${screen}`;
    if (localStorage.getItem(key)) return;
    setVisible(true);
  }, [screen, user, config]);

  const dismiss = () => {
    if (user) {
      localStorage.setItem(`tooltip_seen_${user.id}_${screen}`, 'true');
    }
    setVisible(false);
  };

  if (!visible || !config) return null;

  return (
    <div className="mb-4 animate-fade-in">
      <div className="inline-flex items-center gap-3 bg-gray-900 text-white rounded-xl px-4 py-3 shadow-lg max-w-md">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{config.label}</p>
          <p className="text-xs text-gray-300 mt-0.5">{config.text}</p>
        </div>
        <button onClick={dismiss} className="text-xs font-medium bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 transition shrink-0">
          Got it
        </button>
      </div>
    </div>
  );
}
