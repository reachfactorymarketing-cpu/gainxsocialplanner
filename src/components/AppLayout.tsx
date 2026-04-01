import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useRole } from '@/hooks/useRole';
import { RoleBadge } from '@/components/Badges';
import { NotificationBell } from '@/components/NotificationBell';
import logo from '@/assets/GainX_logo.png';
import { Home, CheckSquare, Calendar, FileText, MessageCircle, Users, BarChart3, Store, Megaphone, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard', roles: 'all' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks', roles: 'all' },
  { to: '/schedule', icon: Calendar, label: 'Schedule', roles: 'all' },
  { to: '/documents', icon: FileText, label: 'Documents', roles: 'all' },
  { to: '/chat', icon: MessageCircle, label: 'Chat', roles: 'authenticated' },
  { to: '/people', icon: Users, label: 'People', roles: 'admin' },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: 'admin' },
  { to: '/vendors', icon: Store, label: 'Vendors', roles: 'admin,vendor' },
  { to: '/announcements', icon: Megaphone, label: 'Announcements', roles: 'admin' },
];

export default function AppLayout() {
  const { user, isGuest, signOut, setGuest } = useAuthStore();
  const { role, isAdmin, isGuestRole } = useRole();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = navItems.filter((item) => {
    if (item.roles === 'all') return true;
    if (item.roles === 'authenticated') return !isGuestRole;
    return item.roles.split(',').some(r => r === role);
  });

  const handleSignOut = async () => {
    if (isGuest) {
      setGuest(false);
    } else {
      await signOut();
    }
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-card">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <img src={logo} alt="GainX" className="w-8 h-8" />
          <span className="font-bold text-sm gradient-text">GS Planner</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {(user?.name || 'G')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{isGuest ? 'Guest' : user?.name}</p>
              <RoleBadge role={role} />
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full px-2 py-1.5">
            <LogOut size={16} /> {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
          <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          {isGuestRole && (
            <div className="text-xs bg-gainx-amber/10 text-gainx-amber px-3 py-1 rounded-full font-medium">
              Guest Mode — Read Only
            </div>
          )}
          <NotificationBell />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {(user?.name || 'G')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/80" onClick={() => setMobileOpen(false)}>
            <div className="w-64 h-full bg-card border-r border-border p-4" onClick={(e) => e.stopPropagation()}>
              <nav className="space-y-1">
                {filteredNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        isActive ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-30">
        {filteredNav.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-semibold transition ${isActive ? "text-purple-600" : "text-gray-500"}`
            }
          >
            <item.icon size={20} />
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
