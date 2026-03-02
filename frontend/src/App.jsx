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
import './App.css';

axios.defaults.baseURL = 'http://localhost:5001';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <h1>Smart Retail Billing System</h1>
        </nav>
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
      </div>
    </Router>
  );
}

export default App;