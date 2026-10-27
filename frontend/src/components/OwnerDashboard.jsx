import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Boxes, Brain, ChartLine, FlaskConical, IndianRupee, Minus, PackagePlus, Plus, Receipt, RefreshCw, Save, Search, ShoppingBag, TriangleAlert,
} from 'lucide-react';
import axios, { apiError } from '../lib/api';
import { CATEGORIES, LOW_STOCK, formatINR, formatNumber, formatShortDate } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { matchLevel } from './CheckoutSuggestions';
import {
  Button, Card, CategoryBadge, CategoryTile, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, StockBadge, Tabs, cn,
} from './ui';

// Validated categorical slots (fixed order). Colour follows the category, never its rank.
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const CATEGORY_COLOR = Object.fromEntries(CATEGORIES.map((c, i) => [c, SERIES[i]]));
const colorForCategory = (name, index) => CATEGORY_COLOR[name] || SERIES[(CATEGORIES.length + index) % SERIES.length];

const AXIS_TICK = { fontSize: 11, fill: '#64748b' };
// Avoids recharts' "width(-1)" warning on the first render, before the container is measured.
const CHART_INITIAL_SIZE = { width: 320, height: 240 };
const formatAxisINR = (v) => (v >= 1000 ? `₹${+(v / 1000).toFixed(1)}k` : `₹${v}`);
const GRID = '#eef2f6';

const TABS = [
  { id: 'overview', label: 'Overview', icon: ChartLine },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'ml', label: 'ML settings', icon: Brain },
];

const ChartTooltip = ({ active, payload, label, valueLabel, format = formatINR, labelFormat = (l) => l }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg shadow-slate-900/10">
      <p className="font-medium text-slate-500">{labelFormat(label ?? item.name)}</p>
      <p className="mt-0.5 font-semibold text-slate-900">
        {valueLabel}: {format(item.value)}
      </p>
    </div>
  );
};

const Kpi = ({ icon: Icon, label, value, hint, tone = 'indigo' }) => (
  <Card className="p-4 sm:p-5">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <span className={cn('flex size-8 items-center justify-center rounded-lg', tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600')}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
    </div>
    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
  </Card>
);

const ChartCard = ({ title, subtitle, children, className }) => (
  <Card className={cn('p-5', className)}>
    <h3 className="font-semibold text-slate-900">{title}</h3>
    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </Card>
);

const Overview = ({ analytics, products, loading, onRestock }) => {
  const lowStock = useMemo(() => products.filter((p) => p.Stock <= LOW_STOCK).sort((a, b) => a.Stock - b.Stock), [products]);

  if (loading && !analytics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        <Skeleton className="h-80 rounded-2xl sm:col-span-2 lg:col-span-3" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }
  if (!analytics) return <EmptyState icon={ChartLine} title="Analytics unavailable" description="We couldn't load store analytics. Try refreshing." />;

  const { kpis, revenueOverTime, topProducts, categoryData } = analytics;
  const aov = kpis.totalOrders ? kpis.totalRevenue / kpis.totalOrders : 0;
  const categoryTotal = categoryData.reduce((sum, c) => sum + c.value, 0);
  const hasSales = kpis.totalOrders > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi icon={IndianRupee} label="Revenue" value={formatINR(kpis.totalRevenue)} hint="Completed orders" />
        <Kpi icon={Receipt} label="Orders" value={formatNumber(kpis.totalOrders)} hint={`Avg ${formatINR(aov)} per order`} />
        <Kpi icon={ShoppingBag} label="Units sold" value={formatNumber(kpis.totalItemsSold)} hint={`${products.length} products listed`} />
        <Kpi icon={TriangleAlert} tone="amber" label="Low stock" value={formatNumber(lowStock.length)} hint={`${LOW_STOCK} units or fewer`} />
      </div>

      {!hasSales ? (
        <EmptyState icon={ChartLine} title="No sales yet" description="Revenue trends, best sellers and category mix appear here after the first checkout." />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Daily revenue" subtitle="Last 30 days with sales" className="lg:col-span-2">
              <div className="h-72">
                <ResponsiveContainer initialDimension={CHART_INITIAL_SIZE}>
                  <AreaChart data={revenueOverTime} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="date" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={formatShortDate} minTickGap={24} />
                    <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={64} tickFormatter={formatAxisINR} />
                    <Tooltip content={<ChartTooltip valueLabel="Revenue" labelFormat={formatShortDate} />} cursor={{ stroke: '#cbd5e1' }} />
                    <Area type="monotone" dataKey="revenue" stroke={SERIES[0]} strokeWidth={2} fill="url(#revFill)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: SERIES[0] }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Revenue by category" subtitle="Share of completed sales">
              <div className="h-44">
                <ResponsiveContainer initialDimension={CHART_INITIAL_SIZE}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="95%" paddingAngle={0} stroke={categoryData.length > 1 ? '#fff' : 'none'} strokeWidth={2}>
                      {categoryData.map((c, i) => <Cell key={c.name} fill={colorForCategory(c.name, i)} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueLabel="Revenue" />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {categoryData.map((c, i) => (
                  <li key={c.name} className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorForCategory(c.name, i) }} aria-hidden="true" />
                    <span className="flex-1 text-slate-700">{c.name}</span>
                    <span className="font-medium text-slate-900 tabular-nums">{formatINR(c.value)}</span>
                    <span className="w-10 text-right text-xs text-slate-500 tabular-nums">{categoryTotal ? Math.round((c.value / categoryTotal) * 100) : 0}%</span>
                  </li>
                ))}
              </ul>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Best sellers" subtitle="Units sold, top 5">
              <div className="h-64">
                <ResponsiveContainer initialDimension={CHART_INITIAL_SIZE}>
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap={10}>
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ ...AXIS_TICK, fill: '#334155' }} tickLine={false} axisLine={false} width={110} />
                    <Tooltip content={<ChartTooltip valueLabel="Units" format={formatNumber} />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="totalSold" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <LowStockCard items={lowStock} onRestock={onRestock} />
          </div>
        </>
      )}

      {!hasSales && lowStock.length > 0 && <LowStockCard items={lowStock} onRestock={onRestock} />}
    </div>
  );
};

const LowStockCard = ({ items, onRestock }) => (
  <ChartCard title="Low stock" subtitle={`Products with ${LOW_STOCK} or fewer units`}>
    {items.length === 0 ? (
      <p className="py-10 text-center text-sm text-slate-500">Everything is well stocked.</p>
    ) : (
      <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto pr-1">
        {items.map((p) => (
          <li key={p.ProductID} className="flex items-center gap-3 py-2.5">
            <CategoryTile category={p.Category} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{p.Name}</p>
              <StockBadge stock={p.Stock} />
            </div>
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => onRestock(p)}>10</Button>
          </li>
        ))}
      </ul>
    )}
  </ChartCard>
);

// Edits are held locally and saved on blur/Enter, so typing "120" is one request, not three.
const NumberCell = ({ value, onCommit, step = 1, min = 0, prefix, label, stepper = false }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = step === 1 ? parseInt(draft, 10) : parseFloat(draft);
    if (Number.isNaN(parsed) || parsed < min) {
      setDraft(String(value));
      return;
    }
    if (parsed !== value) onCommit(parsed);
  };

  const input = (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-slate-400">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setDraft(String(value)); e.currentTarget.blur(); } }}
        aria-label={label}
        className={cn(
          'h-8 border-0 text-sm font-medium text-slate-900 tabular-nums focus:ring-2 focus:ring-indigo-600 focus:outline-none',
          stepper ? 'w-16 bg-transparent px-1 text-center ring-0 focus:ring-inset' : 'w-24 rounded-lg bg-white pr-2 ring-1 ring-slate-200 ring-inset',
          prefix ? 'pl-6' : !stepper && 'pl-2.5'
        )}
      />
    </div>
  );
  if (!stepper) return input;

  const stepBtn = 'flex w-8 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30';
  return (
    <div className="inline-flex h-8 items-stretch overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 ring-inset" role="group" aria-label={label}>
      <button type="button" className={stepBtn} onClick={() => onCommit(value - step)} disabled={value - step < min} aria-label="Decrease">
        <Minus className="size-3.5" />
      </button>
      {input}
      <button type="button" className={stepBtn} onClick={() => onCommit(value + step)} aria-label="Increase">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
};

const Inventory = ({ products, loading, onUpdate, onAdd }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (category === 'All' || p.Category === category)
      && (!q || p.Name.toLowerCase().includes(q))
      && (stockFilter === 'all' || (stockFilter === 'low' ? p.Stock <= LOW_STOCK && p.Stock > 0 : p.Stock <= 0)));
  }, [products, query, category, stockFilter]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex-1">
          <Input icon={Search} type="search" placeholder="Search inventory" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search inventory" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-40" aria-label="Filter by category">
            <option value="All">All categories</option>
            {[...new Set(products.map((p) => p.Category))].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="sm:w-36" aria-label="Filter by stock">
            <option value="all">Any stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>
        </div>
        <Button icon={PackagePlus} onClick={onAdd}>Add product</Button>
      </div>

      {loading && products.length === 0 ? (
        <div className="space-y-2 p-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : visible.length === 0 ? (
        <p className="p-12 text-center text-sm text-slate-500">No products match these filters.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Stock</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((p) => (
                  <tr key={p.ProductID} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <CategoryTile category={p.Category} size="sm" />
                        <div>
                          <p className="font-medium text-slate-900">{p.Name}</p>
                          <p className="text-xs text-slate-400">#{p.ProductID}{p.Weight ? ` · ${p.Weight} kg` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3"><CategoryBadge category={p.Category} /></td>
                    <td className="px-3 py-3"><NumberCell value={p.Price} step={0.01} prefix="₹" label={`Price of ${p.Name}`} onCommit={(v) => onUpdate(p, { price: v })} /></td>
                    <td className="px-3 py-3">
                      <NumberCell stepper value={p.Stock} label={`Stock of ${p.Name}`} onCommit={(v) => onUpdate(p, { stock: v })} />
                    </td>
                    <td className="px-5 py-3 text-right"><StockBadge stock={p.Stock} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {visible.map((p) => (
              <li key={p.ProductID} className="p-4">
                <div className="flex items-center gap-3">
                  <CategoryTile category={p.Category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{p.Name}</p>
                    <StockBadge stock={p.Stock} />
                  </div>
                  <CategoryBadge category={p.Category} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <NumberCell value={p.Price} step={0.01} prefix="₹" label={`Price of ${p.Name}`} onCommit={(v) => onUpdate(p, { price: v })} />
                  <NumberCell stepper value={p.Stock} label={`Stock of ${p.Name}`} onCommit={(v) => onUpdate(p, { stock: v })} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
};

const EMPTY_PRODUCT = { name: '', price: '', stock: '', category: '', weight: '' };

const AddProductModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/products', {
        name: form.name.trim(),
        price: Number(form.price),
        stock: parseInt(form.stock, 10),
        category: form.category,
        weight: form.weight === '' ? null : Number(form.weight),
      });
      toast.success(`${form.name.trim()} added to inventory`);
      setForm(EMPTY_PRODUCT);
      onCreated();
      onClose();
    } catch (err) {
      toast.error('Could not add product', { description: apiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add product"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="add-product" loading={saving} icon={PackagePlus}>Add product</Button>
        </>
      )}
    >
      <form id="add-product" onSubmit={submit} className="space-y-4">
        <Field label="Name" htmlFor="p-name">
          <Input id="p-name" value={form.name} onChange={set('name')} required placeholder="e.g. Green Tea" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₹)" htmlFor="p-price">
            <Input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
          </Field>
          <Field label="Stock" htmlFor="p-stock">
            <Input id="p-stock" type="number" min="0" step="1" value={form.stock} onChange={set('stock')} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="p-category">
            <Select id="p-category" value={form.category} onChange={set('category')} required>
              <option value="" disabled>Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Weight (kg)" htmlFor="p-weight">
            <Input id="p-weight" type="number" min="0" step="0.01" value={form.weight} onChange={set('weight')} placeholder="Optional" />
          </Field>
        </div>
      </form>
    </Modal>
  );
};

const Slider = ({ id, label, help, value, min, max, onChange }) => (
  <div>
    <div className="flex items-baseline justify-between">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      <span className="text-sm font-semibold text-indigo-600 tabular-nums">{Math.round(value * 100)}%</span>
    </div>
    <p className="mb-3 text-xs text-slate-500">{help}</p>
    <input id={id} type="range" min={min} max={max} step="0.01" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
  </div>
);

const META_LABELS = {
  algorithm: 'Algorithm', totalTransactions: 'Transactions', totalFrequentItemsets: 'Frequent itemsets', totalRules: 'Rules', minSupport: 'Min support', minConfidence: 'Min confidence', error: 'Error',
};

const MlLab = ({ products, settings, setSettings, onSave, saving }) => {
  const [selected, setSelected] = useState([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  const byCategory = useMemo(() => products.reduce((acc, p) => ({ ...acc, [p.Category]: [...(acc[p.Category] || []), p] }), {}), [products]);
  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const run = async () => {
    setRunning(true);
    setResults(null);
    try {
      const res = await axios.post('/api/checkout-recommendations', { items: selected, minSupport: settings.minSupport, minConfidence: settings.minConfidence });
      setResults(res.data);
    } catch {
      setResults({ recommendations: [], metadata: { error: 'Failed to run algorithm' } });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card className="h-fit p-5 lg:sticky lg:top-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><Brain className="size-4.5" aria-hidden="true" /></span>
          <div>
            <h3 className="font-semibold text-slate-900">Apriori thresholds</h3>
            <p className="text-xs text-slate-500">Applied to every customer checkout</p>
          </div>
        </div>
        <div className="space-y-6">
          <Slider id="ml-support" label="Minimum support" help="How often items must appear together across all orders." value={settings.minSupport} min="0.01" max="0.5" onChange={(v) => setSettings((s) => ({ ...s, minSupport: v }))} />
          <Slider id="ml-confidence" label="Minimum confidence" help="Probability a shopper buys B when A is already in the cart." value={settings.minConfidence} min="0.01" max="1" onChange={(v) => setSettings((s) => ({ ...s, minConfidence: v }))} />
        </div>
        <Button variant="success" icon={Save} className="mt-6 w-full" loading={saving} onClick={onSave}>Save global settings</Button>
      </Card>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Test with a simulated cart</h3>
              <p className="text-xs text-slate-500">{selected.length ? `${selected.length} product${selected.length === 1 ? '' : 's'} selected` : 'Pick products a customer might have in their cart'}</p>
            </div>
            <div className="flex gap-2">
              {selected.length > 0 && <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Clear</Button>}
              <Button size="sm" icon={FlaskConical} onClick={run} loading={running} disabled={selected.length === 0}>Run Apriori</Button>
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(byCategory).map(([cat, list]) => (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {list.map((p) => (
                    <button
                      key={p.ProductID}
                      type="button"
                      onClick={() => toggle(p.ProductID)}
                      aria-pressed={selected.includes(p.ProductID)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition',
                        selected.includes(p.ProductID) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 ring-inset hover:ring-indigo-300'
                      )}
                    >
                      {p.Name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {(running || results) && (
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900">Results</h3>
            {running ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
            ) : (
              <>
                {results.metadata && Object.keys(results.metadata).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(results.metadata).map(([key, val]) => (
                      <span key={key} className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 ring-inset', key === 'error' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-50 text-slate-600 ring-slate-200')}>
                        {META_LABELS[key] || key}
                        <strong className="font-semibold text-slate-900">{key.startsWith('min') ? `${Math.round(val * 100)}%` : String(val)}</strong>
                      </span>
                    ))}
                  </div>
                )}
                {results.recommendations?.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {results.recommendations.map((rec) => {
                      const level = matchLevel(rec.confidence);
                      return (
                        <div key={rec.productId} className="rounded-2xl p-4 ring-1 ring-slate-200 ring-inset">
                          <div className="flex items-start gap-3">
                            <CategoryTile category={rec.category} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-slate-900">{rec.name}</p>
                              <p className="text-sm text-slate-500">{formatINR(rec.price)}</p>
                            </div>
                          </div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className={cn('h-full rounded-full', level.bar)} style={{ width: `${Math.min(rec.confidence * 100, 100)}%` }} />
                          </div>
                          <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div><dt className="text-slate-400">Confidence</dt><dd className="font-semibold text-slate-800">{(rec.confidence * 100).toFixed(1)}%</dd></div>
                            <div><dt className="text-slate-400">Support</dt><dd className="font-semibold text-slate-800">{(rec.support * 100).toFixed(1)}%</dd></div>
                            <div><dt className="text-slate-400">Lift</dt><dd className="font-semibold text-slate-800">{rec.lift?.toFixed(2)}×</dd></div>
                          </dl>
                          {rec.antecedentNames && (
                            <p className="mt-2 truncate text-xs text-slate-500" title={`${rec.antecedentNames.join(' + ')} → ${rec.name}`}>
                              {rec.antecedentNames.join(' + ')} → <span className="font-medium text-slate-700">{rec.name}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-6 text-center text-sm text-slate-500">No rules matched. Lower the thresholds or pick different products.</p>
                )}
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

const OwnerDashboard = () => {
  const [tab, setTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState({ minSupport: 0.05, minConfidence: 0.1 });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const toast = useToast();

  const fetchProducts = () => axios.get('/api/products').then((res) => setProducts(res.data));

  const refresh = async () => {
    setLoading(true);
    const [prod, stats, ml] = await Promise.allSettled([
      fetchProducts(),
      axios.get('/api/analytics'),
      axios.get('/api/settings/ml'),
    ]);
    if (stats.status === 'fulfilled') setAnalytics(stats.value.data);
    if (ml.status === 'fulfilled') {
      setSettings((s) => ({
        minSupport: ml.value.data.minSupport ?? s.minSupport,
        minConfidence: ml.value.data.minConfidence ?? s.minConfidence,
      }));
    }
    if (prod.status === 'rejected' || stats.status === 'rejected') toast.error('Some dashboard data failed to load');
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const updateProduct = async (product, patch) => {
    const before = products;
    const fields = { ...(patch.price != null && { Price: patch.price }), ...(patch.stock != null && { Stock: patch.stock }) };
    setProducts((prev) => prev.map((p) => (p.ProductID === product.ProductID ? { ...p, ...fields } : p)));
    try {
      await axios.put(`/api/products/${product.ProductID}`, patch);
    } catch (err) {
      setProducts(before);
      toast.error(`Couldn't update ${product.Name}`, { description: apiError(err) });
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.put('/api/settings/ml', settings);
      toast.success('ML settings saved', { description: 'Customer checkouts now use these thresholds.' });
    } catch (err) {
      toast.error('Failed to save settings', { description: apiError(err) });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Store owner"
        title="Dashboard"
        subtitle="Sales performance, inventory and recommendation tuning."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={refresh} loading={loading}>Refresh</Button>}
      />
      <div className="scrollbar-none -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Tabs tabs={TABS} value={tab} onChange={setTab} className="min-w-max" />
      </div>

      {tab === 'overview' && <Overview analytics={analytics} products={products} loading={loading} onRestock={(p) => updateProduct(p, { stock: p.Stock + 10 })} />}
      {tab === 'inventory' && <Inventory products={products} loading={loading} onUpdate={updateProduct} onAdd={() => setAddOpen(true)} />}
      {tab === 'ml' && <MlLab products={products} settings={settings} setSettings={setSettings} onSave={saveSettings} saving={savingSettings} />}

      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={fetchProducts} />
    </div>
  );
};

export default OwnerDashboard;
