import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('cart');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      navigate('/');
    };
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.Price * (item.quantity || 1), 0);

  return (
    <div>
      <h2>Your Shopping Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item, index) => (
            <div key={index} className="cart-item">
              <span>{item.Name} - ₹{item.Price} x {item.quantity || 1}</span>
              <button onClick={() => removeFromCart(index)}>Remove</button>
            </div>
          ))}
          <p><strong>Total: ₹{total}</strong></p>
          <button onClick={() => navigate('/products')}>Continue Shopping</button>
          <button onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
          <button onClick={handleLogout} style={{ marginTop: '10px', backgroundColor: '#eb4d4b' }}>Logout</button>
        </>
      )}
    </div>
  );
};

export default Cart;