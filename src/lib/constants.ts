export const EVENT_NAME = "Gain X Social";
export const EVENT_DATE = "2026-05-23";
export const EVENT_VENUE = "New Journey Christian Center";
export const EVENT_CITY = "Philadelphia, PA";
export const EVENT_CAPACITY = 120;
export const EVENT_TIME = "12:00 PM – 3:00 PM";

export type AppRole = 'admin' | 'zone_lead' | 'volunteer' | 'instructor' | 'vendor' | 'reset_space_partner' | 'guest';
export type Zone = 'Move Floor' | 'Reset Space' | 'Link-Up' | 'Vendor Row' | 'General';
export type TaskStatus = 'To Do' | 'In Progress' | 'Needs Review' | 'Done';
export type Priority = 'low' | 'medium' | 'high';
export type Phase = 'setup' | 'event' | 'breakdown';

export const ZONES: Zone[] = ['Move Floor', 'Reset Space', 'Link-Up', 'Vendor Row', 'General'];

export const ZONE_COLORS: Record<Zone, string> = {
  'Move Floor': 'bg-zone-move-floor',
  'Reset Space': 'bg-zone-reset-space',
  'Link-Up': 'bg-zone-link-up',
  'Vendor Row': 'bg-zone-vendor-row',
  'General': 'bg-zone-general',
};

export const ZONE_TEXT_COLORS: Record<Zone, string> = {
  'Move Floor': 'text-gainx-purple',
  'Reset Space': 'text-gainx-teal',
  'Link-Up': 'text-gainx-amber',
  'Vendor Row': 'text-gainx-orange',
  'General': 'text-gainx-gray',
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  zone_lead: 'Zone Lead',
  volunteer: 'Volunteer',
  instructor: 'Instructor',
  vendor: 'Vendor',
  reset_space_partner: 'Reset Space Partner',
  guest: 'Guest',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-gainx-purple text-primary-foreground',
  zone_lead: 'bg-gainx-teal text-primary-foreground',
  volunteer: 'bg-gainx-blue text-primary-foreground',
  instructor: 'bg-gainx-amber text-primary-foreground',
  vendor: 'bg-gainx-orange text-primary-foreground',
  reset_space_partner: 'bg-gainx-emerald text-primary-foreground',
  guest: 'bg-gainx-gray text-primary-foreground',
};

export const CHANNELS = ['#all-hands', '#move-floor', '#reset-space', '#link-up', '#vendor-row'] as const;

export const TASK_COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'Needs Review', 'Done'];

export const DEMO_CREDENTIALS = [
  { email: 'admin@gainsocial.com', password: 'GainSocial2026', role: 'Admin' as const, label: 'Admin View', description: 'Tasks, people, reports, all zones', color: 'bg-gainx-purple' },
  { email: 'jasmine@gainsocial.com', password: 'password', role: 'Zone Lead' as const, label: 'Zone Lead View', description: 'Zone tasks, chat, brainstorm', color: 'bg-gainx-teal' },
  { email: 'tanya@gainsocial.com', password: 'password', role: 'Volunteer' as const, label: 'Volunteer View', description: 'My tasks, schedule, zone chat', color: 'bg-gainx-blue' },
  { email: 'vendor@gainsocial.com', password: 'password', role: 'Vendor' as const, label: 'Vendor View', description: 'Booth details, commitments', color: 'bg-gainx-orange' },
  { email: 'marcus@gainsocial.com', password: 'password', role: 'Instructor' as const, label: 'Instructor View', description: 'Class schedule, zone tasks', color: 'bg-gainx-amber' },
  { email: 'reset@gainsocial.com', password: 'password', role: 'Reset Space' as const, label: 'Reset Space View', description: 'Reset Space zone tasks', color: 'bg-gainx-emerald' },
];
