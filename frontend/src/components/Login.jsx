import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, Crown, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import axios, { apiError } from '../lib/api';
import { homeFor, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthShell from './AuthShell';
import { Button, Field, Input } from './ui';

const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(null); // 'password' | 'guest' | 'owner'
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const finish = (data) => {
    signIn(data);
    toast.success(`Welcome, ${data.user?.username || 'back'}!`);
    // Return to the page that asked for sign-in; route guards bounce roles that can't open it.
    navigate(location.state?.from || homeFor(data.user), { replace: true });
  };

  const run = async (kind, request, fallback) => {
    setError('');
    setPending(kind);
    try {
      const res = await request();
      finish(res.data);
    } catch (err) {
      setError(apiError(err, fallback));
      setPending(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    run('password', () => axios.post('/api/auth/login', { email: email.trim(), password }), 'Incorrect email or password.');
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500">Sign in to continue shopping or manage your store.</p>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200 ring-inset">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" icon={Mail} autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            trailing={(
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded-lg p-2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            )}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending === 'password'} disabled={Boolean(pending)}>
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or try the demo
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          icon={UserRound}
          loading={pending === 'guest'}
          disabled={Boolean(pending)}
          onClick={() => run('guest', () => axios.post('/api/auth/guest-login'), 'Guest sign-in failed.')}
        >
          Guest
        </Button>
        <Button
          variant="secondary"
          icon={Crown}
          loading={pending === 'owner'}
          disabled={Boolean(pending)}
          onClick={() => run('owner', () => axios.post('/api/auth/owner-login'), 'Owner sign-in failed.')}
        >
          Store owner
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Create an account</Link>
      </p>
      <p className="mt-3 text-center text-sm text-slate-500">
        Gate staff?{' '}
        <Link to="/verify" className="font-semibold text-indigo-600 hover:text-indigo-500">Verify an order</Link>
      </p>
    </AuthShell>
  );
};

export default Login;
