import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { DEMO_CREDENTIALS } from '@/lib/constants';
import logo from '@/assets/GainX_logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setGuest } = useAuthStore();

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

  const fillDemo = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 max-h-[95vh] overflow-y-auto">
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
              placeholder="you@gainsocial.com"
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
          <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">Explore by role</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.email}
              onClick={() => fillDemo(cred)}
              className="text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <span className={`inline-block text-[10px] font-semibold text-white px-2 py-0.5 rounded-full mb-1.5 ${cred.color}`}>
                {cred.role}
              </span>
              <p className="text-xs font-medium text-foreground">{cred.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{cred.description}</p>
            </button>
          ))}

          {/* Guest card */}
          <button
            onClick={handleGuestAccess}
            className="text-left bg-gray-50 border border-dashed border-gray-300 rounded-xl p-3 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <span className="inline-block text-[10px] font-semibold text-white px-2 py-0.5 rounded-full mb-1.5 bg-gainx-gray">
              Guest
            </span>
            <p className="text-xs font-medium text-foreground">Guest View</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Read-only event overview</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
