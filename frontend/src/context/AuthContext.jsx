import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const readProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

const SESSION_KEYS = ['token', 'user', 'userRole', 'userId', 'cart'];

export const homeFor = (user) => (user?.role === 'owner' ? '/owner-dashboard' : '/products');

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [profile, setProfile] = useState(readProfile);

  const user = useMemo(() => {
    if (!token) return null;
    const claims = decodeToken(token) || {};
    const email = claims.email ?? profile?.email ?? '';
    return {
      id: claims.id ?? profile?.id ?? localStorage.getItem('userId'),
      email,
      role: claims.role ?? profile?.role ?? localStorage.getItem('userRole') ?? 'customer',
      name: profile?.username || (email ? email.split('@')[0] : 'Customer'),
    };
  }, [token, profile]);

  const signIn = useCallback(({ token: nextToken, user: nextUser }) => {
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser || {}));
    localStorage.setItem('userRole', nextUser?.role || 'customer');
    if (nextUser?.id != null) localStorage.setItem('userId', nextUser.id);
    setToken(nextToken);
    setProfile(nextUser || null);
  }, []);

  const signOut = useCallback(() => {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    setToken(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', signOut);
    return () => window.removeEventListener('auth:expired', signOut);
  }, [signOut]);

  const value = useMemo(() => ({ user, token, signIn, signOut }), [user, token, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
