import { useEffect } from 'react';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import Schedule from '@/pages/Schedule';
import Documents from '@/pages/Documents';
import Chat from '@/pages/Chat';
import People from '@/pages/People';
import Reports from '@/pages/Reports';
import Vendors from '@/pages/Vendors';
import Announcements from '@/pages/Announcements';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isGuest, isLoading, initialize, setGuest } = useAuthStore();

  useEffect(() => {
    // Handle ?guest=true param (from role preview)
    const params = new URLSearchParams(window.location.search);
    if (params.get('guest') === 'true') {
      setGuest(true);
      window.history.replaceState({}, '', '/');
    }
    initialize();
    const timeout = setTimeout(() => {
      useAuthStore.setState({ isLoading: false });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [initialize, setGuest]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !isGuest) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConnectionStatus />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGate><AppLayout /></AuthGate>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/people" element={<People />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/announcements" element={<Announcements />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
