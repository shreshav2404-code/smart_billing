import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [qrCode, setQrCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const navigate = useNavigate();

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('You must be logged in to checkout.');
      navigate('/'); // Redirect to login
      return;
    }

    const items = cart.map(item => ({ productId: item.ProductID, quantity: item.quantity || 1 }));
    try {
      const res = await axios.post('/api/checkout', { items }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Store the QR code URL in state to display it
      setQrCode(res.data.qrCodeUrl);
      setOrderId(res.data.orderId);
      // Clear cart
      localStorage.removeItem('cart');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  if (qrCode) {
    return (
      <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Order Completed Successfully! ✅</h2>
        <p style={{ fontSize: '18px', color: '#4CAF50' }}>Order ID: <strong>{orderId}</strong></p>
        <p style={{ color: '#666' }}>Scan this QR code at the gate for verification.</p>
        <img src={qrCode} alt="QR Code" style={{ display: 'block', margin: '20px auto', maxWidth: '300px' }} />
        <button onClick={() => navigate('/verify')} style={{ marginRight: '10px' }}>Go to Verification Page</button>
        <button onClick={() => navigate('/products')}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Checkout</h2>
      <h3>Order Summary</h3>
      {cart.map((item, index) => (
        <div key={index} style={{ borderBottom: '1px solid #ddd', padding: '10px 0' }}>
          <p>{item.Name} - ₹{item.Price} x {item.quantity || 1}</p>
        </div>
      ))}
      <p><strong>Total Amount: ₹{cart.reduce((sum, item) => sum + item.Price * (item.quantity || 1), 0)}</strong></p>
      <button onClick={handleCheckout}>Confirm and Pay</button>
    </div>
  );
};

export default Checkout;