import { Apple, Dumbbell, Pill, Plug, Sparkles, Tag } from 'lucide-react';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatINR = (value) => inr.format(Number(value) || 0);

export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(Number(value) || 0);

// SQLite CURRENT_TIMESTAMP is UTC without a zone ("2026-10-27 05:04:07").
// Parse it as UTC; plain `new Date(str)` treats it as local time (and Safari rejects it).
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const parseDbDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  let iso = value;
  if (DATE_ONLY.test(value)) iso = `${value}T00:00:00Z`;
  else if (!/[zZ]|[+-]\d\d:?\d\d$/.test(value)) iso = `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value) => {
  const date = parseDbDate(value);
  if (!date) return '—';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const formatShortDate = (value) => {
  const date = parseDbDate(value);
  if (!date) return value || '';
  // A bare calendar date (SQLite DATE()) is already a UTC day; don't shift it into local time.
  const timeZone = typeof value === 'string' && DATE_ONLY.test(value) ? 'UTC' : undefined;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone });
};

// Full class strings so Tailwind can see them at build time.
export const CATEGORY_META = {
  Groceries: { icon: Apple, tile: 'bg-emerald-50 text-emerald-600', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
  Sports: { icon: Dumbbell, tile: 'bg-orange-50 text-orange-600', chip: 'bg-orange-50 text-orange-700 ring-orange-600/15' },
  Medical: { icon: Pill, tile: 'bg-rose-50 text-rose-600', chip: 'bg-rose-50 text-rose-700 ring-rose-600/15' },
  Electrical: { icon: Plug, tile: 'bg-amber-50 text-amber-600', chip: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  Beauty: { icon: Sparkles, tile: 'bg-fuchsia-50 text-fuchsia-600', chip: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/15' },
};

const FALLBACK_META = { icon: Tag, tile: 'bg-slate-100 text-slate-600', chip: 'bg-slate-100 text-slate-700 ring-slate-600/15' };

export const categoryMeta = (category) => CATEGORY_META[category] || FALLBACK_META;

export const CATEGORIES = Object.keys(CATEGORY_META);

export const LOW_STOCK = 10;
