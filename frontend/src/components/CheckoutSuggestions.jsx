import { useEffect, useMemo, useState } from 'react';
import { Brain, Check, Plus } from 'lucide-react';
import axios from '../lib/api';
import { formatINR } from '../lib/format';
import { Card, CategoryTile, Skeleton, cn } from './ui';

export const matchLevel = (confidence) => {
  if (confidence >= 0.7) return { label: 'Strong match', bar: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50' };
  if (confidence >= 0.4) return { label: 'Good match', bar: 'bg-amber-500', text: 'text-amber-700 bg-amber-50' };
  return { label: 'Possible match', bar: 'bg-slate-400', text: 'text-slate-600 bg-slate-100' };
};

// Apriori association rules for the current cart. Thresholds come from the
// owner's global ML settings, which the backend applies when none are sent.
const CheckoutSuggestions = ({ cart, onAddToCart }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(() => new Set());

  // Recompute only when the set of products changes, not on quantity edits.
  const cartKey = useMemo(() => cart.map((i) => i.ProductID).sort((a, b) => a - b).join(','), [cart]);

  useEffect(() => {
    if (!cartKey) return undefined;
    let cancelled = false;
    setLoading(true);
    axios.post('/api/checkout-recommendations', { items: cartKey.split(',').map(Number) })
      .then((res) => { if (!cancelled) setSuggestions(res.data?.recommendations || []); })
      .catch(() => { if (!cancelled) setSuggestions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cartKey]);

  const inCart = new Set(cart.map((i) => i.ProductID));
  const visible = suggestions.filter((s) => !inCart.has(s.productId) || added.has(s.productId));

  if (!cartKey || (!loading && visible.length === 0)) return null;

  const handleAdd = (s) => {
    onAddToCart({ ProductID: s.productId, Name: s.name, Price: s.price, Stock: s.stock, Category: s.category });
    setAdded((prev) => new Set(prev).add(s.productId));
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
          <Brain className="size-4.5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">Complete your basket</h2>
          <p className="text-xs text-slate-500">Suggested by Apriori association-rule mining on past orders</p>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {loading
          ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : visible.slice(0, 4).map((s) => {
            const level = matchLevel(s.confidence);
            const isAdded = added.has(s.productId);
            return (
              <div key={s.productId} className={cn('rounded-2xl p-4 ring-1 transition ring-inset', isAdded ? 'bg-emerald-50/50 ring-emerald-200' : 'bg-white ring-slate-200')}>
                <div className="flex items-start gap-3">
                  <CategoryTile category={s.category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{s.name}</p>
                    <p className="text-sm text-slate-500">{formatINR(s.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !isAdded && handleAdd(s)}
                    disabled={isAdded || s.stock <= 0}
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg transition',
                      isAdded ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40'
                    )}
                    aria-label={isAdded ? `${s.name} added` : `Add ${s.name}`}
                  >
                    {isAdded ? <Check className="size-4" /> : <Plus className="size-4" />}
                  </button>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className={cn('rounded-full px-1.5 py-0.5 font-semibold', level.text)}>{level.label}</span>
                    <span className="font-medium text-slate-500 tabular-nums">{Math.round(s.confidence * 100)}% confidence</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full', level.bar)} style={{ width: `${Math.min(s.confidence * 100, 100)}%` }} />
                  </div>
                </div>
                {s.antecedentNames?.length > 0 && (
                  <p className="mt-2.5 truncate text-xs text-slate-500" title={s.antecedentNames.join(' + ')}>
                    Often bought with <span className="font-medium text-slate-700">{s.antecedentNames.join(' + ')}</span>
                  </p>
                )}
              </div>
            );
          })}
      </div>
    </Card>
  );
};

export default CheckoutSuggestions;
