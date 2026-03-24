
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OrderHistory = () => {
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      navigate('/');
    };
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Order History</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/products')} style={{ padding: '8px 16px' }}>Back to Shop</button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#eb4d4b', color: 'white' }}>Logout</button>
        </div>
      </div>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {orders.map((order) => (
            <div key={order.OrderID} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>Order #{order.OrderID}</span>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  backgroundColor: order.Status === 'completed' ? '#e8f5e9' : '#fff3e0',
                  color: order.Status === 'completed' ? '#2e7d32' : '#e65100'
                }}>
                  {order.Status.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '14px' }}>
                <span>Date: {new Date(order.CreatedAt).toLocaleString()}</span>
                <span>Items: {order.ItemCount}</span>
              </div>
              <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '18px', fontWeight: 'bold', color: '#155ecb' }}>
                Total: ₹{order.TotalAmount}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
