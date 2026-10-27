import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, IndianRupee, Package, Receipt, RefreshCw, ShoppingBag } from 'lucide-react';
import axios, { apiError } from '../lib/api';
import { formatDateTime, formatINR, formatNumber } from '../lib/format';
import { Button, Card, EmptyState, PageHeader, Skeleton, cn } from './ui';

const STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

const Stat = ({ icon: Icon, label, value }) => (
  <Card className="flex items-center gap-4 p-4 sm:p-5">
    <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
      <Icon className="size-5" aria-hidden="true" />
    </span>
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
    </div>
  </Card>
);

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data);
    } catch (err) {
      setError(apiError(err, 'Could not load your orders.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const spent = orders.reduce((sum, o) => sum + (o.TotalAmount || 0), 0);
  const units = orders.reduce((sum, o) => sum + (o.ItemCount || 0), 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Order history"
        subtitle="Every purchase, with its gate verification status."
        actions={<Button variant="secondary" icon={RefreshCw} onClick={load} loading={loading}>Refresh</Button>}
      />

      {error ? (
        <EmptyState icon={Receipt} title="Couldn't load orders" description={error} action={<Button variant="secondary" onClick={load}>Try again</Button>} />
      ) : loading && orders.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="When you check out, your receipts will show up here."
          action={<Button onClick={() => navigate('/products')} iconRight={ArrowRight}>Start shopping</Button>}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat icon={Receipt} label="Orders" value={formatNumber(orders.length)} />
            <Stat icon={IndianRupee} label="Total spent" value={formatINR(spent)} />
            <Stat icon={Package} label="Items bought" value={formatNumber(units)} />
          </div>
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.OrderID}>
                <Card className="p-4 transition hover:shadow-md sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">Order #{order.OrderID}</h3>
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset', STATUS_STYLES[order.Status] || 'bg-slate-100 text-slate-600 ring-slate-500/20')}>
                          {order.Status}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {formatDateTime(order.CreatedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">{formatINR(order.TotalAmount)}</p>
                      <p className="text-xs text-slate-500">{order.ItemCount} item{order.ItemCount === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  {order.ItemSummary && (
                    <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{order.ItemSummary}</p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default OrderHistory;
