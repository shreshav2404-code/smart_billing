import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, PackageOpen, RefreshCw, Search, ShoppingCart, Sparkles, Target, X } from 'lucide-react';
import axios, { apiError } from '../lib/api';
import { formatINR } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  Button, Card, CategoryBadge, CategoryTile, EmptyState, Input, PageHeader, QuantityStepper, Select, Skeleton, StockBadge, cn,
} from './ui';

const SORTS = {
  featured: { label: 'Featured', fn: null },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.Price - b.Price },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.Price - a.Price },
  name: { label: 'Name: A–Z', fn: (a, b) => a.Name.localeCompare(b.Name) },
};

const ProductCard = ({ product, inCart, onAdd, readOnly }) => {
  const [qty, setQty] = useState(1);
  const soldOut = product.Stock <= 0;
  const remaining = Math.max(product.Stock - inCart, 0);

  return (
    <Card className="group flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <CategoryTile category={product.Category} />
        {inCart > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">
            <ShoppingCart className="size-3" aria-hidden="true" /> {inCart} in cart
          </span>
        )}
      </div>
      <h3 className="mt-4 line-clamp-2 font-semibold text-slate-900">{product.Name}</h3>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-xs text-slate-500">{product.Category}</span>
        <span className="text-slate-300" aria-hidden="true">•</span>
        <StockBadge stock={product.Stock} />
      </div>
      <p className="mt-3 text-xl font-bold tracking-tight text-slate-900">{formatINR(product.Price)}</p>

      {!readOnly && (
        <div className="mt-auto flex items-center gap-2 pt-4">
          <QuantityStepper value={Math.min(qty, Math.max(remaining, 1))} onChange={setQty} max={Math.max(remaining, 1)} size="sm" label={`Quantity of ${product.Name}`} />
          <Button
            size="sm"
            className="h-8 flex-1"
            icon={ShoppingCart}
            disabled={soldOut || remaining === 0}
            onClick={() => { onAdd(product, Math.min(qty, remaining)); setQty(1); }}
          >
            {soldOut ? 'Sold out' : remaining === 0 ? 'Max added' : 'Add'}
          </Button>
        </div>
      )}
    </Card>
  );
};

const ProductSkeleton = () => (
  <Card className="p-5">
    <Skeleton className="size-11 rounded-xl" />
    <Skeleton className="mt-4 h-4 w-3/4" />
    <Skeleton className="mt-2 h-3 w-1/2" />
    <Skeleton className="mt-4 h-6 w-1/3" />
    <Skeleton className="mt-5 h-8 w-full" />
  </Card>
);

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [userRecs, setUserRecs] = useState([]);
  const [loadingUserRecs, setLoadingUserRecs] = useState(false);
  const [cartRecs, setCartRecs] = useState([]);
  const { user } = useAuth();
  const { items, count, total, addItem, quantityOf } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const isOwner = user?.role === 'owner';

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      setError(apiError(err, 'Could not load products.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (isOwner) return;
    setLoadingUserRecs(true);
    axios.get('/api/user-recommendations')
      .then((res) => setUserRecs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUserRecs([]))
      .finally(() => setLoadingUserRecs(false));
  }, [isOwner]);

  // "Frequently bought together" depends only on which products are in the cart.
  const cartKey = useMemo(() => items.map((i) => i.ProductID).sort((a, b) => a - b).join(','), [items]);
  useEffect(() => {
    if (!cartKey) {
      setCartRecs([]);
      return;
    }
    let cancelled = false;
    axios.post('/api/recommendations', { items: cartKey.split(',').map(Number) })
      .then((res) => { if (!cancelled) setCartRecs(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setCartRecs([]); });
    return () => { cancelled = true; };
  }, [cartKey]);

  const categories = useMemo(() => {
    const counts = products.reduce((acc, p) => ({ ...acc, [p.Category]: (acc[p.Category] || 0) + 1 }), {});
    return [['All', products.length], ...Object.entries(counts)];
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => (category === 'All' || p.Category === category) && (!q || p.Name.toLowerCase().includes(q) || p.Category?.toLowerCase().includes(q)));
    return SORTS[sort].fn ? [...list].sort(SORTS[sort].fn) : list;
  }, [products, query, category, sort]);

  const productById = useMemo(() => Object.fromEntries(products.map((p) => [p.ProductID, p])), [products]);
  const boughtTogether = cartRecs.map((id) => productById[id]).filter((p) => p && !quantityOf(p.ProductID));

  const handleAdd = (product, qty = 1) => {
    // Recommendation payloads can carry stale stock; prefer the live catalogue entry.
    const live = productById[product.ProductID] || product;
    const added = addItem(live, qty);
    if (added === 0) {
      toast.error(`No more ${live.Name} available`, { description: 'You already have all remaining stock in your cart.' });
      return;
    }
    toast.success(`Added ${added} × ${live.Name}`, {
      description: added < qty ? `Only ${added} more in stock.` : undefined,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={isOwner ? 'Storefront preview' : `Hi, ${user?.name || 'there'}`}
        title={isOwner ? 'What customers see' : 'Discover products'}
        subtitle={loading ? 'Loading catalogue…' : `${products.length} products across ${Math.max(categories.length - 1, 0)} categories`}
        actions={!isOwner && count > 0 && (
          <Button variant="dark" onClick={() => navigate('/cart')} iconRight={ArrowRight}>
            {count} item{count === 1 ? '' : 's'} · {formatINR(total)}
          </Button>
        )}
      />

      {isOwner && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset">
          <Eye className="size-4 shrink-0" aria-hidden="true" />
          You're viewing the storefront as the store owner. Manage prices and stock from the dashboard.
        </div>
      )}

      {/* Search, sort & categories */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              icon={Search}
              type="search"
              placeholder="Search products or categories"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
              trailing={query && (
                <button type="button" onClick={() => setQuery('')} className="rounded-lg p-2 text-slate-400 hover:text-slate-600" aria-label="Clear search">
                  <X className="size-4" />
                </button>
              )}
            />
          </div>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="sm:w-56" aria-label="Sort products">
            {Object.entries(SORTS).map(([id, { label }]) => <option key={id} value={id}>{label}</option>)}
          </Select>
        </div>
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2">
            {categories.map(([name, n]) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                aria-pressed={category === name}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
                  category === name ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 ring-inset hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {name}
                <span className={cn('rounded-full px-1.5 text-xs tabular-nums', category === name ? 'bg-white/20' : 'bg-slate-100 text-slate-500')}>{n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Personalised picks */}
      {!isOwner && (loadingUserRecs || userRecs.length > 0) && category === 'All' && !query && (
        <section className="mb-8 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 ring-1 ring-indigo-100 ring-inset sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
              <Sparkles className="size-4.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Recommended for you</h2>
              <p className="text-xs text-slate-500">Based on shoppers with similar taste</p>
            </div>
          </div>
          <div className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
            {loadingUserRecs
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-56 shrink-0 rounded-2xl" />)
              : userRecs.map((prod, idx) => (
                <div key={prod.ProductID} className="flex w-60 shrink-0 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
                  <CategoryTile category={prod.Category} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold tracking-wide text-indigo-600 uppercase">Top pick #{idx + 1}</p>
                    <p className="truncate text-sm font-semibold text-slate-900" title={prod.Name}>{prod.Name}</p>
                    <p className="text-sm text-slate-500">{formatINR(prod.Price)}</p>
                  </div>
                  <Button size="icon" variant="secondary" onClick={() => handleAdd(prod)} aria-label={`Add ${prod.Name} to cart`} disabled={prod.Stock <= 0}>
                    <ShoppingCart className="size-4" />
                  </Button>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Catalogue */}
      {error ? (
        <EmptyState
          icon={PackageOpen}
          title="Couldn't load products"
          description={error}
          action={<Button variant="secondary" icon={RefreshCw} onClick={loadProducts}>Try again</Button>}
        />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No products match"
          description="Try a different search term or category."
          action={<Button variant="secondary" onClick={() => { setQuery(''); setCategory('All'); }}>Clear filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((product) => (
            <ProductCard key={product.ProductID} product={product} inCart={quantityOf(product.ProductID)} onAdd={handleAdd} readOnly={isOwner} />
          ))}
        </div>
      )}

      {/* Cart-based association rules */}
      {!isOwner && boughtTogether.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Target className="size-4.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">Frequently bought together</h2>
              <p className="text-xs text-slate-500">Shoppers who bought what's in your cart also picked these</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {boughtTogether.map((prod) => (
              <button
                key={prod.ProductID}
                type="button"
                onClick={() => handleAdd(prod)}
                disabled={prod.Stock <= 0}
                className="group flex flex-col items-start rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:ring-indigo-300 disabled:opacity-50"
              >
                <CategoryBadge category={prod.Category} />
                <span className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">{prod.Name}</span>
                <span className="mt-1 text-sm text-slate-500">{formatINR(prod.Price)}</span>
                <span className="mt-3 text-xs font-semibold text-indigo-600 group-hover:text-indigo-500">+ Add to cart</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Products;
