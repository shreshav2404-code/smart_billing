import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Products from './components/Products';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import QRVerify from './components/QRVerify';
import OwnerDashboard from './components/OwnerDashboard';
import axios from 'axios';
import './App.css'; // You can keep index.css or App.css depending on what you import in main.jsx

// Fix Axios Base URL for Production vs Development
axios.defaults.baseURL = import.meta.env.PROD ? '' : 'http://localhost:5001';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <nav className="flex items-center justify-between min-h-[60px] bg-white shadow-sm px-4 sm:px-6 lg:px-8 mb-6 rounded-b-xl border-b border-slate-200">
          <div className="min-w-[120px] text-left"></div>
          <h1 className="flex-1 text-center m-0 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 py-4">
            Smart Retail Billing System
          </h1>
          <div className="min-w-[120px]"></div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/verify" element={<QRVerify />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;