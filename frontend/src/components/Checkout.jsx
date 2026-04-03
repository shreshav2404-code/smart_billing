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
      <div className="max-w-xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-xl text-center transform hover:scale-[1.01] transition-transform">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40">
          <span className="text-4xl text-white">✓</span>
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Order Confirmed!</h2>
        <p className="text-lg text-slate-500 mb-8">
          Order ID: <span className="font-bold text-slate-800 tracking-wide">#{orderId}</span>
        </p>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
          <p className="text-slate-500 font-medium mb-2">Your verification OTP is:</p>
          <p className="text-5xl font-black text-blue-600 tracking-[0.25em]">{otp}</p>
        </div>

        <p className="text-slate-500 font-medium mb-6">
          Scan this QR code or provide the OTP at the gate for verification.
        </p>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 inline-block mb-10">
          <img src={qrCode} alt="QR Code" className="w-56 h-56 object-contain" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/verify')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors w-full sm:w-auto"
          >
            🔍 Go to Verify
          </button>
          <button 
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold rounded-xl transition-colors w-full sm:w-auto"
          >
            🛍️ Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-8">🛒 Checkout</h2>

      {cart.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm text-center border border-slate-100">
          <p className="text-xl text-slate-600 mb-6">Your cart is empty.</p>
          <button 
            onClick={() => navigate('/products')}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* The ML suggestions component will render naturally, but it might need to be styled inside its own source. Let's wrap it nicely */}
            <div className="bg-white/50 backdrop-blur rounded-3xl overflow-hidden border border-slate-100">
               <CheckoutSuggestions cart={cart} onAddToCart={handleAddSuggestion} />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-slate-100 sticky top-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">📋 Order Summary</h3>
              
              <div className="flex flex-col gap-3 mb-6 max-h-[400px] overflow-y-auto pr-2">
                {cart.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1 w-full">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mb-1 inline-block uppercase">
                        {item.Category}
                      </span>
                      <p className="font-semibold text-slate-800 text-sm leading-tight">{item.Name}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <button className="w-7 h-7 flex justify-center items-center font-bold text-slate-500 hover:bg-slate-100" onClick={() => updateQuantity(index, (item.quantity || 1) - 1)}>−</button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">{item.quantity || 1}</span>
                        <button className="w-7 h-7 flex justify-center items-center font-bold text-slate-500 hover:bg-slate-100" onClick={() => updateQuantity(index, (item.quantity || 1) + 1)}>+</button>
                      </div>
                      
                      <span className="font-bold text-slate-800 text-sm w-12 text-right">
                        ₹{(item.Price * (item.quantity || 1)).toFixed(0)}
                      </span>
                      
                      <button 
                        className="w-7 h-7 flex justify-center items-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                        onClick={() => removeFromCart(index)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-6 mb-8 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Amount</span>
                <span className="text-3xl font-black text-slate-800">₹{total.toFixed(0)}</span>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    '💳 Confirm & Pay'
                  )}
                </button>

                <button
                  onClick={() => navigate('/products')}
                  className="w-full py-3 px-6 bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold rounded-xl transition-all"
                >
                  ← Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;