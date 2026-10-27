import { forwardRef } from 'react';
import { LoaderCircle, Minus, Plus } from 'lucide-react';
import { categoryMeta } from '../lib/format';

export const cn = (...classes) => classes.filter(Boolean).join(' ');

const BUTTON_VARIANTS = {
  primary: 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-500 focus-visible:outline-indigo-600',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 shadow-sm hover:bg-slate-50 hover:ring-slate-300 focus-visible:outline-indigo-600',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-indigo-600',
  success: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 focus-visible:outline-emerald-600',
  danger: 'bg-white text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 focus-visible:outline-rose-600',
  dark: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:outline-slate-900',
};

const BUTTON_SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-base',
  icon: 'size-9 rounded-lg',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, iconRight: IconRight, className, children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
      {IconRight && !loading && <IconRight className="size-4" aria-hidden="true" />}
    </button>
  );
});

export const Card = ({ className, children, ...props }) => (
  <div className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-sm', className)} {...props}>
    {children}
  </div>
);

export const Spinner = ({ className }) => (
  <LoaderCircle className={cn('size-5 animate-spin text-indigo-600', className)} aria-label="Loading" />
);

export const Skeleton = ({ className }) => <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />;

export const PageHeader = ({ title, subtitle, actions, eyebrow }) => (
  <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wider text-indigo-600 uppercase">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center', className)}>
    {Icon && (
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="size-7" aria-hidden="true" />
      </div>
    )}
    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const Field = ({ label, htmlFor, hint, children }) => (
  <div>
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
  </div>
);

export const Input = forwardRef(function Input({ icon: Icon, className, trailing, ...props }, ref) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
      <input
        ref={ref}
        className={cn(
          'block h-11 w-full rounded-xl border-0 bg-white text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 ring-inset transition placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none',
          Icon ? 'pl-10' : 'pl-3.5',
          trailing ? 'pr-11' : 'pr-3.5',
          className
        )}
        {...props}
      />
      {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
    </div>
  );
});

export const Select = ({ className, children, ...props }) => (
  <select
    className={cn(
      'block h-11 w-full rounded-xl border-0 bg-white pr-9 pl-3.5 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 ring-inset focus:ring-2 focus:ring-indigo-600 focus:outline-none',
      className
    )}
    {...props}
  >
    {children}
  </select>
);

export const QuantityStepper = ({ value, onChange, min = 1, max = Infinity, size = 'md', label = 'Quantity' }) => {
  const dims = size === 'sm' ? 'h-8 [&>button]:w-8 text-sm' : 'h-10 [&>button]:w-10 text-sm';
  return (
    <div className={cn('inline-flex items-stretch overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 ring-inset', dims)} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="flex min-w-8 items-center justify-center px-1 font-semibold text-slate-900 tabular-nums" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
};

export const CategoryTile = ({ category, size = 'md', className }) => {
  const { icon: Icon, tile } = categoryMeta(category);
  const dims = { sm: 'size-9 rounded-lg [&>svg]:size-4', md: 'size-11 rounded-xl [&>svg]:size-5', lg: 'size-14 rounded-2xl [&>svg]:size-7' }[size];
  return (
    <div className={cn('flex shrink-0 items-center justify-center', tile, dims, className)} aria-hidden="true">
      <Icon />
    </div>
  );
};

export const CategoryBadge = ({ category, className }) => (
  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', categoryMeta(category).chip, className)}>
    {category || 'Other'}
  </span>
);

export const StockBadge = ({ stock }) => {
  if (stock <= 0) return <span className="text-xs font-semibold text-rose-600">Out of stock</span>;
  if (stock <= 10) return <span className="text-xs font-semibold text-amber-600">Only {stock} left</span>;
  return <span className="text-xs font-medium text-emerald-600">In stock</span>;
};

export const Tabs = ({ tabs, value, onChange, className }) => (
  <div className={cn('inline-flex rounded-xl bg-slate-100 p-1', className)} role="tablist">
    {tabs.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={value === id}
        onClick={() => onChange(id)}
        className={cn(
          'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition sm:flex-none',
          value === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
        )}
      >
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        {label}
      </button>
    ))}
  </div>
);

export const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <Plus className="size-5 rotate-45" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};
