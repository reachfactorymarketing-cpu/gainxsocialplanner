import { useAuthStore } from '@/stores/authStore';
import type { AppRole } from '@/lib/constants';

export function useRole() {
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);

  const role: AppRole = isGuest ? 'guest' : (user?.role ?? 'guest');

  const isAdmin = role === 'admin';
  const isZoneLead = role === 'zone_lead';
  const isVolunteer = role === 'volunteer';
  const isInstructor = role === 'instructor';
  const isVendor = role === 'vendor';
  const isResetSpacePartner = role === 'reset_space_partner';
  const isGuestRole = role === 'guest';

  const canManageTasks = isAdmin || isZoneLead;
  const canManageSchedule = isAdmin;
  const canManagePeople = isAdmin;
  const canViewReports = isAdmin;
  const canManageVendors = isAdmin;
  const canManageAnnouncements = isAdmin;
  const canManageDocuments = isAdmin;

  return {
    role, isAdmin, isZoneLead, isVolunteer, isInstructor,
    isVendor, isResetSpacePartner, isGuestRole,
    canManageTasks, canManageSchedule, canManagePeople,
    canViewReports, canManageVendors, canManageAnnouncements, canManageDocuments,
  };
}
