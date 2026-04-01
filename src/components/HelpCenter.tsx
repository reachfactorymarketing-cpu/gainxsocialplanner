import { useState, useMemo } from 'react';
import { X, Search, HelpCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import { TOURS } from '@/components/WelcomeTour';

const APP_FAQ = [
  { q: 'How do I mark a task complete?', a: 'Tap the task card and check the box, or drag it to the Done column.' },
  { q: 'How do I message someone?', a: 'Go to Chat and select your zone channel or #all-hands for the whole team.' },
  { q: 'Where do I find my schedule?', a: 'Tap Schedule in the navigation bar to see your personal call time and slots.' },
  { q: 'How do I find a document?', a: 'Go to Documents, use the search bar, or browse by folder name.' },
  { q: 'How do I know if my task is overdue?', a: 'Overdue tasks show a red left border and appear first on your dashboard.' },
  { q: 'What if I was assigned the wrong role?', a: 'Message Admin in the Chat tab and they can update your role from People & Roles.' },
  { q: 'Can I replay the welcome tour?', a: 'Yes — tap Replay Welcome Tour at the bottom of the How to Use tab.' },
  { q: 'How do I turn off notifications?', a: 'Go to your profile avatar and select Notification Settings to adjust.' },
  { q: 'How do I see who is on my team?', a: 'Go to Chat and check your zone channel members, or ask your Zone Lead.' },
  { q: 'I forgot my password, what do I do?', a: 'Click Forgot Password on the login page or ask Admin to send a reset email.' },
];

const EVENT_FAQ = [
  { q: 'What time do I need to arrive?', a: 'Setup begins at 8:00 AM. All volunteers must arrive by 9:30 AM for briefing.' },
  { q: 'Where is the event?', a: 'New Journey Christian Center, Philadelphia PA. Check the Emergency Contact Sheet in Documents for parking.' },
  { q: 'How long does the event run?', a: 'The event runs 12:00 PM to 3:00 PM. Setup from 8 AM, breakdown until 4:30 PM.' },
  { q: 'What are the three zones?', a: 'Move Floor (fitness), Reset Space (reflection), and Link-Up (social lounge).' },
  { q: 'What is the Gain Card?', a: 'Attendees get a stamp card at check-in. Three stamps unlock a raffle entry.' },
  { q: 'What is the 50/50 raffle?', a: 'Tickets at $10 each. Winner gets half the pool, other half goes to the church.' },
  { q: 'What if I cannot make it to the event?', a: 'Message Admin immediately in Chat so your role can be transferred in time.' },
  { q: 'Who do I contact on event day?', a: 'Message your Zone Lead in Chat first. Admin contact is in the Emergency Sheet.' },
  { q: 'What should I wear?', a: 'Comfortable athletic or smart-casual. Volunteer shirts distributed by Zone Lead.' },
  { q: 'Where is the raffle table?', a: 'Adjacent to The Link-Up zone. See the Vendor Booth Map in Documents for layout.' },
];

interface HelpCenterProps {
  onClose: () => void;
  onReplayTour: () => void;
}

export default function HelpCenter({ onClose, onReplayTour }: HelpCenterProps) {
  const { role } = useRole();
  const [tab, setTab] = useState<'howto' | 'faq-app' | 'faq-event'>('howto');
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tour = TOURS[role] || TOURS.guest;

  const filteredAppFaq = useMemo(() => {
    if (!search) return APP_FAQ;
    const q = search.toLowerCase();
    return APP_FAQ.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [search]);

  const filteredEventFaq = useMemo(() => {
    if (!search) return EVENT_FAQ;
    const q = search.toLowerCase();
    return EVENT_FAQ.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [search]);

  const noResults = search && filteredAppFaq.length === 0 && filteredEventFaq.length === 0;

  const tabs = [
    { id: 'howto' as const, label: 'How to Use' },
    { id: 'faq-app' as const, label: 'FAQ — App' },
    { id: 'faq-event' as const, label: 'FAQ — Event' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-[60]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l border-border z-[61] shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-primary" />
            <h2 className="font-bold">Help Center</h2>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search help…"
              className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-1 shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setOpenFaq(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                tab === t.id ? 'text-white' : 'text-muted-foreground hover:bg-accent'
              }`}
              style={tab === t.id ? { background: 'linear-gradient(135deg, #7C3AED, #F97316)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {noResults && (
            <div className="text-center py-8">
              <Search className="mx-auto mb-2 text-muted-foreground" size={24} />
              <p className="text-sm text-muted-foreground">No results — message your organizer in Chat</p>
            </div>
          )}

          {tab === 'howto' && !noResults && (
            <div className="space-y-4">
              <div className="space-y-3">
                {tour.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED, #F97316)' }}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={onReplayTour}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 rounded-lg text-sm font-medium transition hover:bg-accent"
                style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
              >
                <RotateCcw size={14} /> Replay Welcome Tour
              </button>
            </div>
          )}

          {tab === 'faq-app' && !noResults && (
            <FaqList items={filteredAppFaq} openIndex={openFaq} onToggle={setOpenFaq} />
          )}

          {tab === 'faq-event' && !noResults && (
            <FaqList items={filteredEventFaq} openIndex={openFaq} onToggle={setOpenFaq} />
          )}
        </div>
      </div>
    </>
  );
}

function FaqList({ items, openIndex, onToggle }: { items: { q: string; a: string }[]; openIndex: number | null; onToggle: (i: number | null) => void }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => onToggle(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-accent/50 transition"
          >
            <span className="text-sm font-semibold pr-2">{item.q}</span>
            {openIndex === i ? <ChevronUp size={16} className="shrink-0 text-muted-foreground" /> : <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
