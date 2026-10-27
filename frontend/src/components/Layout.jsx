import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown, History, LayoutDashboard, LogOut, ScanLine, ShoppingBag, ShoppingCart, Store, UserRound,
} from 'lucide-react';
import axios from '../lib/api';
import { homeFor, useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button, cn } from './ui';

const navFor = (user) => {
  if (!user) return [{ to: '/verify', label: 'Gate verify', icon: ScanLine }];
  if (user.role === 'owner') {
    return [
      { to: '/owner-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/products', label: 'Storefront', icon: Store },
      { to: '/verify', label: 'Gate verify', icon: ScanLine },
    ];
  }
  return [
    { to: '/products', label: 'Shop', icon: Store },
    { to: '/orders', label: 'Orders', icon: History },
    { to: '/verify', label: 'Gate verify', icon: ScanLine },
  ];
};

export const Logo = ({ className }) => (
  <Link to="/" className={cn('flex items-center gap-2.5', className)}>
    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25">
      <ShoppingBag className="size-5" aria-hidden="true" />
    </span>
    <span className="leading-tight">
      <span className="block text-base font-bold tracking-tight text-slate-900">SmartBill</span>
      <span className="hidden text-[11px] font-medium text-slate-500 sm:block">Smart retail billing</span>
    </span>
  </Link>
);

// Polls /api/health so anyone using the app can see the backend is up.
const useServerStatus = () => {
  const [status, setStatus] = useState({ state: 'checking', latency: null });
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (document.hidden) return;
      const started = performance.now();
      try {
        await axios.get('/api/health', { timeout: 8000 });
        if (!cancelled) setStatus({ state: 'online', latency: Math.round(performance.now() - started) });
      } catch {
        if (!cancelled) setStatus({ state: 'offline', latency: null });
      }
    };
    check();
    const timer = setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return status;
};

const StatusIndicator = () => {
  const { state, latency } = useServerStatus();
  const label = { checking: 'Checking server…', online: 'All systems operational', offline: 'Server unreachable' }[state];
  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-500" title={latency != null ? `API latency ${latency} ms` : undefined}>
      <span className="relative flex size-2">
        {state === 'online' && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
        <span className={cn('relative inline-flex size-2 rounded-full', { checking: 'bg-slate-300', online: 'bg-emerald-500', offline: 'bg-rose-500' }[state])} />
      </span>
      {label}
      {latency != null && <span className="text-slate-400 tabular-nums">· {latency} ms</span>}
    </span>
  );
};

const UserMenu = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
          {(user.name || 'U').charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 lg:block">{user.name}</span>
        <ChevronDown className="hidden size-4 text-slate-400 sm:block" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase', user.role === 'owner' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700')}>
                {user.role}
              </span>
              {user.id != null && <span className="text-xs text-slate-400">ID #{user.id}</span>}
            </div>
          </div>
          <div className="p-1.5">
            {user.role !== 'owner' && (
              <Link to="/orders" role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <History className="size-4 text-slate-400" /> Order history
              </Link>
            )}
            <button type="button" role="menuitem" onClick={onSignOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CartButton = ({ count, className }) => (
  <Link
    to="/cart"
    className={cn('relative flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900', className)}
    aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
  >
    <ShoppingCart className="size-5" />
    {count > 0 && (
      <span key={count} className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </Link>
);

export default function Layout() {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const links = navFor(user);
  const isCustomer = user && user.role !== 'owner';
  const mobileLinks = isCustomer ? [...links.slice(0, 2), { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: count }, links[2]] : links;

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {isCustomer && <CartButton count={count} className="hidden md:flex" />}
            {user ? (
              <UserMenu user={user} onSignOut={handleSignOut} />
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
                <Button size="sm" onClick={() => navigate('/register')}>Create account</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={cn('mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 lg:px-8', user && 'pb-28 md:pb-10')}>
        <Outlet />
      </main>

      <footer className={cn('border-t border-slate-200/70 bg-white', user && 'mb-16 md:mb-0')}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} SmartBill · React, Express, SQLite &amp; Apriori ML</span>
          <StatusIndicator />
        </div>
      </footer>

      {user && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden" aria-label="Mobile">
          <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${mobileLinks.length}, minmax(0, 1fr))` }}>
            {mobileLinks.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition', isActive ? 'text-indigo-600' : 'text-slate-500')}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden="true" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export function RequireAuth({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
}

export function GuestOnly({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={homeFor(user)} replace />;
  return children;
}
