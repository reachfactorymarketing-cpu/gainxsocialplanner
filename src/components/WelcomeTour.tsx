import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore, type Profile } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import type { AppRole } from '@/lib/constants';

interface TourStep {
  emoji: string;
  title: string;
  body: string;
}

interface TourConfig {
  steps: TourStep[];
  finalButton: string;
  finalRoute: string;
}

const TOURS: Record<string, TourConfig> = {
  admin: {
    steps: [
      { emoji: '🎉', title: 'Welcome to Gain Social Planner!', body: 'This app replaces Trello for planning Gain Social 2026. Everything you need — tasks, schedule, team, documents — is all in one place.' },
      { emoji: '👥', title: 'Add People & Assign Roles', body: 'Your first action is to go to People & Roles and add your team. Each person gets a role that controls exactly what they can see and do in the app.' },
      { emoji: '✅', title: 'The Task Board', body: '40 tasks are pre-loaded and ready. Create new tasks, assign them to team members, and drag cards between columns as work progresses toward May 23rd.' },
      { emoji: '📢', title: 'Send Announcements', body: 'Post messages to your whole team or specific roles. Announcements appear as banners on everyone\'s dashboard so nothing gets missed.' },
      { emoji: '📄', title: 'Document Hub', body: 'All event documents are pre-loaded. Set permissions per document, pin the most important ones, and your team will see them on their dashboard automatically.' },
      { emoji: '📊', title: 'Progress Dashboard', body: 'The Reports screen shows task completion by zone, team performance, and a revenue tracker. Check it daily as May 23rd approaches.' },
    ],
    finalButton: 'Add Your First Team Member →',
    finalRoute: '/people',
  },
  zone_lead: {
    steps: [
      { emoji: '⭐', title: 'Welcome, Zone Lead!', body: 'You\'re responsible for your zone, your team, and making sure everything is ready for event day. This app is your command center.' },
      { emoji: '✅', title: 'Your Zone\'s Task Board', body: 'The Task Board shows all tasks for your zone. Assign tasks to volunteers, move cards as work progresses, and keep an eye on overdue items.' },
      { emoji: '💬', title: 'Zone Chat', body: 'Your zone has a dedicated chat channel. Use it to communicate with your team and with Admin. Check #all-hands for event-wide updates.' },
      { emoji: '💡', title: 'Brainstorm Board', body: 'Got an idea? Drop it on your zone\'s Brainstorm Board in Documents. Any idea can be converted into a real task with one click.' },
      { emoji: '📄', title: 'Documents', body: 'Find your zone briefing docs, run of show, and templates in the Document Hub. Pinned documents are must-reads — check them first.' },
    ],
    finalButton: 'Go to Your Task Board →',
    finalRoute: '/tasks',
  },
  volunteer: {
    steps: [
      { emoji: '🙌', title: 'Welcome, Volunteer!', body: 'Thank you for being part of Gain Social 2026! This app keeps you organized and connected with your team leading up to event day.' },
      { emoji: '✅', title: 'Your Dashboard & Tasks', body: 'Your Dashboard shows exactly what you\'re responsible for. Red border means overdue — tackle those first. Amber means due today.' },
      { emoji: '📅', title: 'Your Schedule', body: 'The Schedule tab shows your call time and zone assignment for May 23rd. Arrive by your listed time and report to your Zone Lead.' },
      { emoji: '💬', title: 'Chat & Documents', body: 'Stay connected via the Chat tab — your zone channel and #all-hands are available. Find your volunteer briefing packet in Documents.' },
    ],
    finalButton: 'Check Your Tasks →',
    finalRoute: '/tasks',
  },
  instructor: {
    steps: [
      { emoji: '💪', title: 'Welcome, Instructor!', body: 'You\'re confirmed for a fitness class at Gain Social 2026! This app has everything you need for class prep and event day coordination.' },
      { emoji: '📅', title: 'Your Schedule Slot', body: 'View your class time, format, and location in the Schedule tab. Contact your Zone Lead if you need to make any changes to your slot.' },
      { emoji: '✅', title: 'Equipment Checklist', body: 'Your tasks include an equipment needs checklist. Mark items confirmed so your Zone Lead knows everything is ready before event day.' },
      { emoji: '💬', title: 'Message Your Zone Lead', body: 'Use the Chat tab to message your Zone Lead directly for setup details, sound check time, and any day-of coordination needs.' },
    ],
    finalButton: 'Review Your Schedule →',
    finalRoute: '/schedule',
  },
  vendor: {
    steps: [
      { emoji: '🏪', title: 'Welcome, Vendor!', body: 'You\'re confirmed for Gain Social 2026! This portal shows your booth details, load-in time, and commitment status all in one place.' },
      { emoji: '📋', title: 'Your Booth & Commitments', body: 'Check the Vendor Portal for your booth location and commitment status. Tap Confirm to lock in your freebie item and raffle donation.' },
      { emoji: '💬', title: 'Message the Organizer', body: 'Use the Chat tab to message Admin directly. They are your main contact for all logistics, questions, and day-of coordination.' },
    ],
    finalButton: 'Confirm Your Commitments →',
    finalRoute: '/vendors',
  },
  reset_space_partner: {
    steps: [
      { emoji: '🧘', title: 'Welcome, Reset Space Partner!', body: 'The Reset Space is the heart of healing at Gain Social. Your contribution creates a safe space for attendees to breathe and reflect.' },
      { emoji: '✅', title: 'Your Setup Checklist', body: 'Your tasks include a full equipment and setup checklist. Review each item and mark confirmed as you prepare for event day.' },
      { emoji: '💬', title: 'Contact & Documents', body: 'Message Admin via Chat for any questions. The Emergency Contact Sheet and Master Run of Show are both in the Document Hub.' },
    ],
    finalButton: 'Review Your Checklist →',
    finalRoute: '/tasks',
  },
  guest: {
    steps: [
      { emoji: '👀', title: 'Welcome, Guest!', body: 'You have read-only access to the Gain Social Planner. Explore tasks, the full schedule, and event documents without an account.' },
      { emoji: '📋', title: 'What You Can See', body: 'Browse all 40 event tasks, the complete May 23 schedule, and documents marked visible to all. You cannot edit anything in guest mode.' },
      { emoji: '🔒', title: 'Want Full Access?', body: 'Ask the event organizer for an invite. With a full account you can manage tasks, message your team, and track your event progress.' },
    ],
    finalButton: 'Start Exploring →',
    finalRoute: '/',
  },
};

interface WelcomeTourProps {
  onClose: () => void;
  onNavigate?: (route: string) => void;
}

export default function WelcomeTour({ onClose, onNavigate }: WelcomeTourProps) {
  const { user, setUser } = useAuthStore();
  const { role } = useRole();
  const [step, setStep] = useState(0);
  const [emailNotif, setEmailNotif] = useState(true);

  const tour = TOURS[role] || TOURS.guest;
  const totalSteps = tour.steps.length;
  const current = tour.steps[step];
  const isLast = step === totalSteps - 1;

  const handleDismiss = async () => {
    if (user) {
      await supabase.from('profiles').update({ has_seen_welcome: true }).eq('id', user.id);
      setUser({ ...user, has_seen_welcome: true } as Profile);
    }
    onClose();
  };

  const handleFinish = async () => {
    await handleDismiss();
    if (onNavigate) onNavigate(tour.finalRoute);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">{current.emoji}</div>
          <p className="text-xs text-gray-400 mb-2">Step {step + 1} of {totalSteps}</p>
          <h2 className="text-xl font-black text-gray-900 mb-3">{current.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{current.body}</p>

          {/* Dot progress */}
          <div className="flex justify-center gap-1.5 mt-6">
            {tour.steps.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: i === step ? '#7C3AED' : '#E5E7EB', transform: i === step ? 'scale(1.3)' : 'scale(1)' }}
              />
            ))}
          </div>

          {/* Email toggle on last step */}
          {isLast && (
            <div className="mt-6 bg-gray-50 rounded-xl p-3 text-left">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEmailNotif(!emailNotif)}
                  className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${emailNotif ? '' : 'bg-gray-300'}`}
                  style={emailNotif ? { background: 'linear-gradient(135deg, #7C3AED, #F97316)' } : {}}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${emailNotif ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Send me email reminders for tasks and messages</p>
                  <p className="text-xs text-gray-500 mt-0.5">You can change this anytime in your profile settings.</p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <div>
            {step === 0 ? (
              <button onClick={handleDismiss} className="text-sm text-gray-400 hover:text-gray-600 transition">
                Skip tour
              </button>
            ) : (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                Back
              </button>
            )}
          </div>
          <button
            onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
            className="px-5 py-2.5 text-sm font-bold text-white rounded-lg transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #F97316)' }}
          >
            {isLast ? tour.finalButton : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export tour data for Help Center reuse
export { TOURS };
export type { TourStep, TourConfig };
