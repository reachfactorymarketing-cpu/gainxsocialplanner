import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { ZONES, ZONE_COLORS } from '@/lib/constants';
import { daysUntilEvent } from '@/lib/dateUtils';
import { BarChart3, CheckSquare, AlertTriangle, CalendarDays, DollarSign } from 'lucide-react';
import { ContextualTooltip } from '@/components/ContextualTooltip';

export default function Reports() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('revenue').select('*').limit(1).single(),
    ]).then(([tRes, pRes, rRes]) => {
      setTasks(tRes.data || []);
      setProfiles(pRes.data || []);
      setRevenue(rRes.data);
      setLoading(false);
    });
  }, []);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const overdue = tasks.filter(t => t.status !== 'Done' && t.due_date && new Date(t.due_date) < new Date()).length;
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const updateRevenue = async (field: string, value: number) => {
    if (!revenue) return;
    await supabase.from('revenue').update({ [field]: value, updated_by: user?.id }).eq('id', revenue.id);
    setRevenue({ ...revenue, [field]: value });
  };

  const totalRevenue = revenue ? Number(revenue.ticket_sales) + Number(revenue.raffle_income) + Number(revenue.fifty_fifty_income) + Number(revenue.donations) + Number(revenue.sponsor_income) : 0;

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <ContextualTooltip screen="reports" />
      <h1 className="text-xl font-bold">Reports</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<CheckSquare size={20} />} label="Total Tasks" value={totalTasks} color="text-primary" />
        <MetricCard icon={<BarChart3 size={20} />} label="% Complete" value={`${pct}%`} color="text-gainx-teal" />
        <MetricCard icon={<AlertTriangle size={20} />} label="Overdue" value={overdue} color="text-destructive" />
        <MetricCard icon={<CalendarDays size={20} />} label="Days to Event" value={daysUntilEvent()} color="text-gainx-blue" />
      </div>

      {/* Zone Progress */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-4">Zone Progress</h2>
        <div className="space-y-3">
          {ZONES.map(zone => {
            const zoneTasks = tasks.filter(t => t.zone === zone);
            const zoneDone = zoneTasks.filter(t => t.status === 'Done').length;
            const zonePct = zoneTasks.length ? Math.round((zoneDone / zoneTasks.length) * 100) : 0;
            return (
              <div key={zone}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{zone}</span>
                  <span className="text-muted-foreground">{zoneDone}/{zoneTasks.length}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${ZONE_COLORS[zone]} transition-all`} style={{ width: `${zonePct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-card border border-border rounded-xl p-4 overflow-x-auto">
        <h2 className="font-semibold mb-4">Team Performance</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Tasks</th>
              <th className="pb-2 font-medium">Done</th>
              <th className="pb-2 font-medium">Overdue</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => {
              const pTasks = tasks.filter(t => t.assignee_id === p.id);
              const pDone = pTasks.filter(t => t.status === 'Done').length;
              const pOverdue = pTasks.filter(t => t.status !== 'Done' && t.due_date && new Date(t.due_date) < new Date()).length;
              return (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2 capitalize">{p.role?.replace('_', ' ')}</td>
                  <td className="py-2">{pTasks.length}</td>
                  <td className="py-2">{pDone}</td>
                  <td className="py-2">{pOverdue > 0 ? <span className="text-destructive font-medium">{pOverdue}</span> : '0'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Revenue */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><DollarSign size={18} /> Revenue Tracker</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {revenue && ['ticket_sales', 'raffle_income', 'fifty_fifty_income', 'donations', 'sponsor_income'].map(field => (
            <div key={field}>
              <label className="text-xs text-muted-foreground capitalize">{field.replace(/_/g, ' ')}</label>
              <input
                type="number"
                value={revenue[field]}
                onChange={e => updateRevenue(field, Number(e.target.value))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background mt-1"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground">Total Revenue</label>
            <div className="text-2xl font-bold gradient-text mt-1">${totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
