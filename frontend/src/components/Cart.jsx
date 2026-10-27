import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import { formatINR } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Button, Card, CategoryTile, EmptyState, PageHeader, QuantityStepper } from './ui';

export const OrderSummary = ({ count, total, children }) => (
  <Card className="p-5 sm:p-6 lg:sticky lg:top-24">
    <h2 className="font-semibold text-slate-900">Order summary</h2>
    <dl className="mt-4 space-y-3 text-sm">
      <div className="flex justify-between text-slate-600">
        <dt>Items</dt>
        <dd className="tabular-nums">{count}</dd>
      </div>
      <div className="flex justify-between text-slate-600">
        <dt>Subtotal</dt>
        <dd className="tabular-nums">{formatINR(total)}</dd>
      </div>
      <div className="flex justify-between text-slate-600">
        <dt>Taxes &amp; fees</dt>
        <dd className="text-emerald-600">Included</dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
        <dt className="font-semibold text-slate-900">Total</dt>
        <dd className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{formatINR(total)}</dd>
      </div>
    </dl>
    <div className="mt-6 space-y-3">{children}</div>
    <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
      <ShieldCheck className="size-3.5" aria-hidden="true" /> Stock is reserved atomically at checkout
    </p>
  </Card>
);

export const CartLine = ({ item, onQuantity, onRemove, compact = false }) => (
  <li className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4">
    <CategoryTile category={item.Category} size={compact ? 'sm' : 'md'} />
    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{item.Name}</p>
        <p className="text-sm text-slate-500">{formatINR(item.Price)} each</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <QuantityStepper value={item.quantity || 1} onChange={(q) => onQuantity(item.ProductID, q)} max={item.Stock > 0 ? item.Stock : Infinity} size="sm" label={`Quantity of ${item.Name}`} />
        <span className="w-24 text-right font-semibold text-slate-900 tabular-nums">{formatINR(item.Price * (item.quantity || 1))}</span>
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Remove ${item.Name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  </li>
);

const Cart = () => {
  const { items, count, total, setQuantity, removeItem, addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const handleRemove = (item) => {
    removeItem(item.ProductID);
    toast.info(`Removed ${item.Name}`, { action: { label: 'Undo', onClick: () => addItem(item, item.quantity || 1) } });
  };

  if (items.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Your cart" />
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the catalogue and add a few things you love."
          action={<Button onClick={() => navigate('/products')} iconRight={ArrowRight}>Start shopping</Button>}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Your cart"
        subtitle={`${count} item${count === 1 ? '' : 's'} ready for checkout`}
        actions={<Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/products')}>Continue shopping</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-4 sm:p-6">
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <CartLine key={item.ProductID} item={item} onQuantity={setQuantity} onRemove={handleRemove} />
            ))}
          </ul>
        </Card>
        <OrderSummary count={count} total={total}>
          <Button size="lg" className="w-full" iconRight={ArrowRight} onClick={() => navigate('/checkout')}>
            Proceed to checkout
          </Button>
        </OrderSummary>
      </div>
    </div>
  );
};

export default Cart;
