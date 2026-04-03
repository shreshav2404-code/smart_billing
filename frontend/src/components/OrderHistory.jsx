import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/');
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await axios.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
    };
    fetchOrders();
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-3xl font-bold text-slate-800">My Order History</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/products')} 
            className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold rounded-xl shadow-sm transition-all"
          >
            Back to Shop
          </button>
          <button 
            onClick={handleLogout} 
            className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover:border-red-200 font-bold rounded-xl shadow-sm transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100">
          <span className="text-6xl mb-4 block">📦</span>
          <p className="text-xl text-slate-600 font-semibold mb-6">No orders found yet.</p>
          <button 
            onClick={() => navigate('/products')} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.OrderID} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <span className="font-bold text-slate-800 text-lg">Order #{order.OrderID}</span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.Status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {order.Status}
                </span>
              </div>
              <div className="flex flex-wrap justify-between items-center bg-slate-50 p-4 rounded-xl mb-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Date & Time</p>
                  <p className="text-sm font-semibold text-slate-700">{new Date(order.CreatedAt).toLocaleDateString()} at {new Date(order.CreatedAt).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Items</p>
                  <p className="text-sm font-semibold text-slate-700">{order.ItemCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total</p>
                  <p className="text-xl font-black text-blue-600">₹{order.TotalAmount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
