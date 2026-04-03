import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

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

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Your Shopping Cart</h2>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-colors">
          Logout
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-xl text-slate-600 font-medium mb-6">Your cart is empty.</p>
          <button 
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col gap-4 mb-6">
              {cart.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                  <div className="flex-1 w-full flex justify-between sm:justify-start items-center gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{item.Name}</h4>
                      <p className="text-slate-500 text-sm">{item.Category}</p>
                    </div>
                    <div className="font-bold text-blue-600 text-lg sm:ml-auto">
                      ₹{item.Price}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(index, (item.quantity || 1) - 1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold"
                      >−</button>
                      <span className="w-10 text-center font-bold text-slate-800">{item.quantity || 1}</span>
                      <button 
                        onClick={() => updateQuantity(index, (item.quantity || 1) + 1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold"
                      >+</button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(index)}
                      className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                      title="Remove Item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-lg text-slate-500">Total Amount:</span>
              <span className="text-3xl font-black text-slate-800">₹{total}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-6 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
            <button 
              onClick={() => navigate('/products')}
              className="flex-1 py-3 px-6 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 font-bold rounded-xl shadow-sm transition-all text-center"
            >
              ← Continue Shopping
            </button>
            <button 
              onClick={() => navigate('/checkout')}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all text-center"
            >
              Proceed to Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;