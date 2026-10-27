import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './lib/api';
import { AuthProvider, homeFor, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Layout, { GuestOnly, RequireAuth } from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Products from './components/Products';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import NotFound from './components/NotFound';
import { Spinner } from './components/ui';

// Heavier screens (charts, camera scanner) load on demand.
const OwnerDashboard = lazy(() => import('./components/OwnerDashboard'));
const QRVerify = lazy(() => import('./components/QRVerify'));

const Home = () => {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user) : '/login'} replace />;
};

const PageFallback = () => (
  <div className="flex justify-center py-24">
    <Spinner className="size-7" />
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
                  <Route path="/cart" element={<RequireAuth role="customer"><Cart /></RequireAuth>} />
                  <Route path="/checkout" element={<RequireAuth role="customer"><Checkout /></RequireAuth>} />
                  <Route path="/orders" element={<RequireAuth role="customer"><OrderHistory /></RequireAuth>} />
                  <Route path="/verify" element={<QRVerify />} />
                  <Route path="/owner-dashboard" element={<RequireAuth role="owner"><OwnerDashboard /></RequireAuth>} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
