import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, CircleAlert, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import axios, { apiError } from '../lib/api';
import { useToast } from '../context/ToastContext';
import AuthShell from './AuthShell';
import { Button, Field, Input } from './ui';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { username: username.trim(), email: email.trim(), password });
      toast.success('Account created', { description: 'Sign in with your new credentials.' });
      navigate('/login', { state: { email: email.trim() } });
    } catch (err) {
      setError(apiError(err, 'Registration failed. Please try again.'));
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-500">Get personalised picks and keep track of every order.</p>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200 ring-inset">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Username" htmlFor="username">
          <Input id="username" icon={AtSign} autoComplete="username" placeholder="keshav" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" icon={Mail} autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 6 characters.">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            autoComplete="new-password"
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
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">Sign in</Link>
      </p>
    </AuthShell>
  );
};

export default Register;
