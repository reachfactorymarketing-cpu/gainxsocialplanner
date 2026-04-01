import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import logo from '@/assets/GainX_logo.png';

const PREVIEW_MAP: Record<string, { email: string; password: string }> = {
  demo: { email: 'demo@gainxsocial.com', password: 'Demo-GainXS26' },
  admin: { email: 'admin@gainxsocial.com', password: 'Demo-GainXS26' },
  lead: { email: 'lead@gainxsocial.com', password: 'Demo-GainXS26' },
  volunteer: { email: 'volunteer@gainxsocial.com', password: 'Demo-GainXS26' },
  vendor: { email: 'vendor@gainxsocial.com', password: 'Demo-GainXS26' },
  instructor: { email: 'instructor@gainxsocial.com', password: 'Demo-GainXS26' },
  reset: { email: 'reset@gainxsocial.com', password: 'Demo-GainXS26' },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setGuest } = useAuthStore();

  // Auto-login for role preview (from Admin dashboard)
  useEffect(() => {
    const preview = searchParams.get('preview');
    if (preview && PREVIEW_MAP[preview]) {
      const cred = PREVIEW_MAP[preview];
      setEmail(cred.email);
      setPassword(cred.password);
      setLoading(true);
      supabase.auth.signInWithPassword({ email: cred.email, password: cred.password })
        .then(({ error: err }) => {
          if (err) {
            setError(err.message);
            setLoading(false);
          } else {
            navigate('/');
          }
        });
    }
  }, [searchParams, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleGuestAccess = () => {
    setGuest(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <img src={logo} alt="Gain X Social" className="w-20 h-20" />
          <h1 className="text-2xl font-bold gradient-text">Gain X Social Planner</h1>
          <p className="text-muted-foreground text-sm text-center">
            Community Wellness Fundraiser · May 23, 2026
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-semibold rounded-lg py-2.5 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
        </div>

        <button
          onClick={handleGuestAccess}
          className="w-full border border-border rounded-lg py-2.5 text-sm font-medium hover:bg-accent transition"
        >
          Continue as Guest (Read-Only)
        </button>

        <p className="text-xs text-muted-foreground text-center">
          First time? Contact your event organizer for access.
        </p>
      </div>
    </div>
  );
};

export default Login;
