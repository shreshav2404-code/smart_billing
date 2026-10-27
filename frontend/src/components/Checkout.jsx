import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy, CreditCard, Download, History, ScanLine, ShoppingCart } from 'lucide-react';
import axios, { apiError } from '../lib/api';
import { formatDateTime, formatINR } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import CheckoutSuggestions from './CheckoutSuggestions';
import { CartLine, OrderSummary } from './Cart';
import { Button, Card, EmptyState, PageHeader } from './ui';

const Receipt = ({ receipt }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copyOtp = async () => {
    try {
      await navigator.clipboard.writeText(receipt.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed', { description: 'Select the code and copy it manually.' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-8 text-center">
        <div className="mx-auto flex size-16 animate-pop items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
          <Check className="size-8" strokeWidth={3} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Payment successful</h1>
        <p className="mt-1.5 text-slate-500">Show the QR code or OTP at the exit gate.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="grid sm:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Order</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">#{receipt.orderId}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Paid</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 tabular-nums">{formatINR(receipt.total)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Date</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{formatDateTime(receipt.placedAt)}</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 ring-inset">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Gate OTP</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="font-mono text-3xl font-bold tracking-[0.3em] text-indigo-600 sm:text-4xl">{receipt.otp}</span>
                <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={copyOtp}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <ul className="mt-6 divide-y divide-slate-100 text-sm">
              {receipt.items.map((item) => (
                <li key={item.ProductID} className="flex justify-between gap-3 py-2">
                  <span className="text-slate-600">
                    {item.Name} <span className="text-slate-400">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-slate-900 tabular-nums">{formatINR(item.Price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 border-t border-dashed border-slate-200 bg-slate-50/60 p-6 sm:border-t-0 sm:border-l sm:p-8">
            <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <img src={receipt.qrCode} alt={`QR code for order ${receipt.orderId}`} className="size-48" />
            </div>
            <a
              href={receipt.qrCode}
              download={`smartbill-order-${receipt.orderId}.png`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              <Download className="size-4" aria-hidden="true" /> Download QR
            </a>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button icon={ScanLine} onClick={() => navigate('/verify')}>Verify at gate</Button>
        <Button variant="secondary" icon={History} onClick={() => navigate('/orders')}>View orders</Button>
        <Button variant="ghost" iconRight={ArrowRight} onClick={() => navigate('/products')}>Keep shopping</Button>
      </div>
    </div>
  );
};

const Checkout = () => {
  const { items, count, total, setQuantity, removeItem, addItem, clear } = useCart();
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setProcessing(true);
    const snapshot = items.map((item) => ({ ...item, quantity: item.quantity || 1 }));
    try {
      const res = await axios.post('/api/checkout', {
        items: snapshot.map((item) => ({ productId: item.ProductID, quantity: item.quantity })),
      });
      setReceipt({
        orderId: res.data.orderId,
        total: res.data.total ?? total,
        otp: res.data.otp,
        qrCode: res.data.qrCodeUrl,
        items: snapshot,
        placedAt: new Date(),
      });
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error('Checkout failed', { description: apiError(err, 'Please try again in a moment.') });
    } finally {
      setProcessing(false);
    }
  };

  if (receipt) return <Receipt receipt={receipt} />;

  if (items.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Checkout" />
        <EmptyState
          icon={ShoppingCart}
          title="Nothing to check out"
          description="Your cart is empty. Add products to place an order."
          action={<Button onClick={() => navigate('/products')} iconRight={ArrowRight}>Browse products</Button>}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Step 2 of 2"
        title="Review & pay"
        subtitle="Check your items, then confirm to get your gate pass."
        actions={<Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/cart')}>Back to cart</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-4 sm:p-6">
            <h2 className="mb-4 font-semibold text-slate-900">Items</h2>
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <CartLine key={item.ProductID} item={item} onQuantity={setQuantity} onRemove={(i) => removeItem(i.ProductID)} compact />
              ))}
            </ul>
          </Card>
          <CheckoutSuggestions cart={items} onAddToCart={(product) => addItem(product, 1)} />
        </div>
        <OrderSummary count={count} total={total}>
          <Button variant="success" size="lg" className="w-full" icon={CreditCard} loading={processing} onClick={handleCheckout}>
            {processing ? 'Processing…' : `Pay ${formatINR(total)}`}
          </Button>
        </OrderSummary>
      </div>
    </div>
  );
};

export default Checkout;
