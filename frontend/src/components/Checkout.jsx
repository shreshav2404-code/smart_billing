import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CheckoutSuggestions from './CheckoutSuggestions';

const Checkout = () => {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [qrCode, setQrCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddSuggestion = (product) => {
    const existingIndex = cart.findIndex(item => item.ProductID === product.ProductID);
    let newCart;
    if (existingIndex > -1) {
      newCart = [...cart];
      newCart[existingIndex].quantity = (newCart[existingIndex].quantity || 1) + 1;
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = newQty;
    setCart(newCart);
  };

  const total = cart.reduce((sum, item) => sum + item.Price * (item.quantity || 1), 0);

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('You must be logged in to checkout.');
      navigate('/');
      return;
    }

    setIsProcessing(true);
    const items = cart.map(item => ({ productId: item.ProductID, quantity: item.quantity || 1 }));
    try {
      const res = await axios.post('/api/checkout', { items }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCode(res.data.qrCodeUrl);
      setOrderId(res.data.orderId);
      setOtp(res.data.otp);
      localStorage.removeItem('cart');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Checkout failed');
    }
    setIsProcessing(false);
  };

  if (qrCode) {
    return (
      <div className="checkout-success">
        <div className="success-icon-circle">
          <span className="success-checkmark">✓</span>
        </div>
        <h2>Order Completed Successfully!</h2>
        <p className="success-order-id">
          Order ID: <strong>#{orderId}</strong>
        </p>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '18px' }}>
          Your verification OTP is: <strong style={{ color: '#1e293b', fontSize: '24px', letterSpacing: '2px' }}>{otp}</strong>
        </p>
        <p style={{ color: '#64748b', marginBottom: '10px' }}>
          Scan this QR code or provide the OTP at the gate for verification.
        </p>
        <img src={qrCode} alt="QR Code" className="qr-code-img" />
        <div className="success-actions">
          <button onClick={() => navigate('/verify')} className="btn-verify">
            🔍 Go to Verification Page
          </button>
          <button onClick={() => navigate('/products')} className="btn-continue">
            🛍️ Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h2>🛒 Checkout</h2>

      {cart.length === 0 ? (
        <div className="checkout-empty">
          <p>Your cart is empty.</p>
          <button onClick={() => navigate('/products')}>Browse Products</button>
        </div>
      ) : (
        <>
          {/* ML Suggestions Section - Before order summary */}
          <CheckoutSuggestions cart={cart} onAddToCart={handleAddSuggestion} />

          {/* Order Summary */}
          <div className="checkout-summary">
            <h3>📋 Order Summary</h3>
            <div className="summary-items">
              {cart.map((item, index) => (
                <div key={index} className="summary-item">
                  <div className="summary-item-info">
                    <span className="summary-item-category">{item.Category}</span>
                    <span className="summary-item-name">{item.Name}</span>
                  </div>
                  <div className="summary-item-controls">
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(index, (item.quantity || 1) - 1)}
                      >
                        −
                      </button>
                      <span className="qty-value">{item.quantity || 1}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(index, (item.quantity || 1) + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="summary-item-price">
                      ₹{(item.Price * (item.quantity || 1)).toFixed(0)}
                    </span>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(index)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total Amount</span>
              <span className="total-price">₹{total.toFixed(0)}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="checkout-pay-btn"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="btn-spinner"></span> Processing...
                </>
              ) : (
                '💳 Confirm & Pay'
              )}
            </button>

            <button
              onClick={() => navigate('/products')}
              className="checkout-back-btn"
            >
              ← Continue Shopping
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Checkout;