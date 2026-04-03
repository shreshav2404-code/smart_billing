import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [recommendations, setRecommendations] = useState([]);
  const [userRecommendations, setUserRecommendations] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [showProfile, setShowProfile] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingUserRecs, setLoadingUserRecs] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    fetchOrders();
  };

  const getUserDetails = () => {
    const token = localStorage.getItem('token');
    if (token) {
      return parseJwt(token);
    }
    return null;
  };

  const userDetails = getUserDetails();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        setProducts(res.data);
        const uniqueCategories = ['All', ...new Set(res.data.map(p => p.Category))];
        setCategories(uniqueCategories);
        const initialQuantities = {};
        res.data.forEach(product => {
          initialQuantities[product.ProductID] = 1;
        });
        setQuantities(initialQuantities);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchUserRecommendations = async () => {
      const token = localStorage.getItem('token');
      if (!token || userDetails?.role === 'owner') return;
      
      setLoadingUserRecs(true);
      try {
        const res = await axios.get('/api/user-recommendations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserRecommendations(res.data);
      } catch (err) {
        console.error('Error fetching user recommendations:', err);
      } finally {
        setLoadingUserRecs(false);
      }
    };
    fetchUserRecommendations();
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      const itemIds = cart.map(p => p.ProductID);
      axios.post('/api/recommendations', { items: itemIds })
        .then(res => {
          setRecommendations(res.data);
        })
        .catch(err => console.log('ML error', err));
    }
  }, []);

  const addToCart = (product) => {
    const quantity = quantities[product.ProductID] || 1;
    
    const existingItemIndex = cart.findIndex(item => item.ProductID === product.ProductID);
    let newCart;
    
    if (existingItemIndex > -1) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity += quantity;
    } else {
      const cartItem = { ...product, quantity };
      newCart = [...cart, cartItem];
    }

    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    
    const itemIds = newCart.map(p => p.ProductID);
    axios.post('/api/recommendations', { items: itemIds })
      .then(res => {
        setRecommendations(res.data);
      })
      .catch(err => console.log('ML error', err));
      
    setToast(`Added ${quantity} ${product.Name}(s) to cart!`);
    setTimeout(() => setToast(null), 1800);
  };

  const updateQuantity = (productId, quantity) => {
    setQuantities({ ...quantities, [productId]: parseInt(quantity) });
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.Category === selectedCategory);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="w-full relative">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 animate-fade-in-up">
          ✓ {toast}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Discover Products</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => navigate('/cart')} 
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl font-semibold transition-all shadow-sm"
          >
            🛒 View Cart <span className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs">{cart.length}</span>
          </button>
          <button 
            onClick={() => navigate('/orders')} 
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl font-semibold transition-all shadow-sm"
          >
            My Orders
          </button>
          <button 
            onClick={handleProfileClick} 
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 rounded-xl font-semibold transition-all shadow-sm"
          >
            👤 Account
          </button>
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl font-semibold transition-all shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* User Recs */}
      {userDetails && userDetails.role !== 'owner' && (userRecommendations.length > 0 || loadingUserRecs) && (
        <div className="mb-10 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="text-lg font-bold text-indigo-900">Recommended For You</h3>
              <p className="text-sm text-indigo-600">Based on your preferences and similar users</p>
            </div>
          </div>
          
          {loadingUserRecs ? (
            <div className="text-center py-8 text-indigo-400 font-medium">Analyzing preferences...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {userRecommendations.map((prod, idx) => (
                <div key={prod.ProductID} className="bg-white rounded-xl shadow-sm border border-indigo-50 p-4 relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 shadow-sm">
                    Top Pick #{idx + 1}
                  </div>
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-3">
                    {prod.Category}
                  </span>
                  <h4 className="font-bold text-slate-800 mb-1 truncate" title={prod.Name}>{prod.Name}</h4>
                  <p className="text-blue-600 font-black text-lg mb-4">₹{prod.Price}</p>
                  <button 
                    onClick={() => addToCart(prod)}
                    className="w-full py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg font-semibold text-sm shadow-md shadow-indigo-500/20 transform hover:-translate-y-0.5 transition-all focus:outline-none"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
        {filteredProducts.map(product => (
          <div key={product.ProductID} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <span className="self-start inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-4">
              {product.Category}
            </span>
            <h3 className="font-bold text-lg text-slate-800 mb-1 leading-tight">{product.Name}</h3>
            <p className="text-2xl font-black text-blue-600 mb-2">₹{product.Price}</p>
            <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${product.Stock > 10 ? 'bg-emerald-400' : product.Stock > 0 ? 'bg-amber-400' : 'bg-red-400'}`}></span>
              {product.Stock} in stock
            </p>
            
            <div className="mt-auto">
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 mb-4 border border-slate-100">
                <span className="text-sm font-semibold text-slate-600 pl-2">Qty</span>
                <input
                  type="number"
                  min="1"
                  max={product.Stock}
                  value={quantities[product.ProductID] || 1}
                  onChange={(e) => updateQuantity(product.ProductID, e.target.value)}
                  className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                onClick={() => addToCart(product)}
                disabled={product.Stock === 0}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold shadow-md transform hover:-translate-y-0.5 transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart based Recs */}
      {recommendations.length > 0 && (
        <div className="bg-white border text-center sm:text-left border-blue-100 rounded-2xl p-6 shadow-sm mb-12">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 justify-center sm:justify-start">
              <span>🎯</span> Frequently Bought Together
            </h3>
            <p className="text-slate-500 text-sm mt-1">Customers who bought your items also liked these</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.map(id => {
              const prod = products.find(p => p.ProductID === id);
              return prod ? (
                <div 
                  key={id} 
                  onClick={() => addToCart(prod)}
                  className="bg-slate-50 border border-slate-100 hover:border-blue-300 rounded-xl p-4 cursor-pointer hover:bg-blue-50 hover:-translate-y-1 transition-all group flex flex-col text-center"
                >
                  <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-2">{prod.Category}</span>
                  <p className="font-semibold text-slate-700 mb-1 text-sm group-hover:text-blue-700">{prod.Name}</p>
                  <p className="font-black text-blue-600 mt-auto">₹{prod.Price}</p>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Account Details</h2>
              <button 
                onClick={() => setShowProfile(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                  {userDetails?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-slate-800">{userDetails?.email || 'N/A'}</p>
                  <p className="text-sm text-slate-500">Customer ID: <span className="font-semibold text-slate-700">#{userDetails?.id || localStorage.getItem('userId')}</span></p>
                  <p className="text-sm text-slate-500">Role: <span className="uppercase text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{localStorage.getItem('userRole') || 'customer'}</span></p>
                </div>
              </div>

              <h3 className="font-bold text-slate-800 mb-4 text-lg">Recent Orders</h3>
              {loadingOrders ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <span className="text-3xl mb-2 block">📦</span>
                  <p className="text-slate-500 font-medium">No orders found yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.OrderID} className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <span className="font-bold text-slate-800">Order #{order.OrderID}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          order.Status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {order.Status}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between text-sm text-slate-500 mb-4 border-b border-slate-50 pb-4">
                        <span>{new Date(order.CreatedAt).toLocaleDateString()} at {new Date(order.CreatedAt).toLocaleTimeString()}</span>
                        <span>{order.ItemCount} items</span>
                      </div>
                      <div className="text-right font-black text-lg text-blue-600">
                        ₹{order.TotalAmount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Products;