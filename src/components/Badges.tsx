import { ROLE_COLORS, ROLE_LABELS, ZONE_COLORS, type AppRole, type Zone } from '@/lib/constants';

export const RoleBadge = ({ role }: { role: AppRole }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}>
    {ROLE_LABELS[role]}
  </span>
);

export const ZoneBadge = ({ zone }: { zone: string }) => {
  const colorClass = ZONE_COLORS[zone as Zone] || 'bg-zone-general';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-primary-foreground ${colorClass}`}>
      {zone}
    </span>
  );
};

export const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = {
    high: 'bg-destructive text-destructive-foreground',
    medium: 'bg-gainx-amber text-primary-foreground',
    low: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[priority] || colors.low}`}>
      {priority}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    confirmed: 'bg-gainx-emerald text-primary-foreground',
    pending: 'bg-gainx-amber text-primary-foreground',
    declined: 'bg-destructive text-destructive-foreground',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
};
