import { Brain, ChartLine, QrCode } from 'lucide-react';
import { Logo } from './Layout';

const FEATURES = [
  { icon: QrCode, title: 'QR + OTP receipts', text: 'Every order gets a scannable pass for instant gate checks.' },
  { icon: Brain, title: 'Smart recommendations', text: 'Apriori and collaborative filtering suggest what goes together.' },
  { icon: ChartLine, title: 'Live store analytics', text: 'Revenue, top sellers and stock levels at a glance.' },
];

// Split-screen frame shared by the sign-in and registration pages.
const AuthShell = ({ children }) => (
  <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-12 text-white lg:flex lg:flex-col">
      <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-violet-400/20 blur-3xl" />
      <div className="relative flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
          <QrCode className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight">SmartBill</span>
      </div>
      <div className="relative mt-auto max-w-md">
        <h2 className="text-4xl leading-tight font-bold tracking-tight">Checkout, reimagined for modern retail.</h2>
        <p className="mt-4 text-lg text-indigo-100">Fast billing, verified exits and AI-powered upsells — all in one place.</p>
        <ul className="mt-10 space-y-5">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-indigo-100/90">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative mt-12 text-xs text-indigo-200">Prices in Indian Rupees (₹)</p>
    </aside>

    <section className="flex flex-col bg-white px-5 py-8 sm:px-10">
      <Logo className="lg:hidden" />
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
    </section>
  </div>
);

export default AuthShell;
