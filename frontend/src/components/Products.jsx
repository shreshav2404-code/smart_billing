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
        // Extract unique categories
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

  // Fetch Personalized Recommendations (Collaborative Filtering)
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
  }, []); // Run once on mount

  // Fetch recommendations on mount if cart has items
  useEffect(() => {
    if (cart.length > 0) {
      const itemIds = cart.map(p => p.ProductID);
      axios.post('/api/recommendations', { items: itemIds })
        .then(res => {
          console.log('Initial Recommendations:', res.data);
          setRecommendations(res.data);
        })
        .catch(err => console.log('ML error', err));
    }
  }, []); // Run once on mount

  const addToCart = (product) => {
    const quantity = quantities[product.ProductID] || 1;
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.ProductID === product.ProductID);
    let newCart;
    
    if (existingItemIndex > -1) {
      // Update quantity if already in cart
      newCart = [...cart];
      newCart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      const cartItem = { ...product, quantity };
      newCart = [...cart, cartItem];
    }

    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    
    // Get recommendations
    const itemIds = newCart.map(p => p.ProductID);
    axios.post('/api/recommendations', { items: itemIds })
      .then(res => {
        console.log('Recommendations:', res.data);
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
    localStorage.removeItem('cart'); // Optional: clear cart on logout
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: 'linear-gradient(90deg, #059669, #10b981)', color: 'white',
          padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
          boxShadow: '0 6px 20px rgba(5,150,105,0.35)', animation: 'fadeInUp 0.3s ease'
        }}>
          ✓ {toast}
        </div>
      )}
      <h2>Browse Products</h2>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/cart')} style={{ width: 'auto', padding: '10px 18px' }}>🛒 View Cart ({cart.length} items)</button>
        <button onClick={() => navigate('/orders')} style={{ width: 'auto', padding: '10px 18px' }}>My Orders</button>
        <button onClick={handleLogout} style={{ width: 'auto', padding: '10px 18px', backgroundColor: '#eb4d4b', color: 'white' }}>Logout</button>
        <button onClick={handleProfileClick} style={{ width: 'auto', padding: '10px 18px', backgroundColor: '#6c5ce7', color: 'white', marginLeft: 'auto' }}>👤 Account Details</button>
      </div>

      {/* Profile Modal Overlay */}
      {showProfile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px', padding: '25px',
            width: '90%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Customer Account Details</h2>
              <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '25px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: '5px 0' }}><strong>Email:</strong> {userDetails?.email || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Customer ID:</strong> #{userDetails?.id || localStorage.getItem('userId')}</p>
              <p style={{ margin: '5px 0' }}><strong>Role:</strong> {localStorage.getItem('userRole') || 'customer'}</p>
            </div>

            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Order History</h3>
            {loadingOrders ? (
              <p>Loading orders...</p>
            ) : orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {orders.map((order) => (
                  <div key={order.OrderID} style={{ 
                    border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold' }}>Order #{order.OrderID}</span>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
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
                    <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#155ecb' }}>
                      Total: ₹{order.TotalAmount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div style={{ marginBottom: '20px', padding: '12px', background: 'linear-gradient(90deg,#eef6ff,#f8fbff)', borderRadius: '8px' }}>
        <p><strong>Categories:</strong></p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 15px',
                backgroundColor: selectedCategory === cat ? '#155ecb' : '#e6eefc',
                color: selectedCategory === cat ? 'white' : '#08305a',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* User Personalized Recommendations */}
      {userDetails && userDetails.role !== 'owner' && (userRecommendations.length > 0 || loadingUserRecs) && (
        <div style={{ marginBottom: '40px', padding: '20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '12px', border: '1px solid #dee2e6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '24px' }}>🌟</span>
            <h3 style={{ margin: 0, color: '#2b7be9' }}>Recommended For You</h3>
          </div>
          <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px' }}>Inspired by your trends and users like you.</p>
          
          {loadingUserRecs ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>Loading personalized insights...</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'flex-start' }}>
              {userRecommendations.map((prod, idx) => (
                <div key={prod.ProductID} style={{ 
                  flex: '0 1 calc(20% - 12px)', minWidth: '160px', 
                  background: 'white', padding: '15px', borderRadius: '10px', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, background: '#ffc107', color: '#000', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderBottomRightRadius: '8px' }}>
                    Top Pick #{idx + 1}
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{prod.Category}</span>
                    <h4 style={{ margin: '4px 0', fontSize: '15px', color: '#1e293b' }}>{prod.Name}</h4>
                    <p style={{ margin: '0 0 10px 0', color: '#2b7be9', fontWeight: 'bold', fontSize: '16px' }}>₹{prod.Price}</p>
                    <button onClick={() => addToCart(prod)} style={{ width: '100%', padding: '8px', fontSize: '13px', background: 'linear-gradient(90deg, #4f46e5, #3b82f6)', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', justifyContent: 'center' }}>
        {filteredProducts.map(product => (
          <div key={product.ProductID} className="product" style={{ flex: '1 1 calc(25% - 15px)', minWidth: '200px', maxWidth: '320px' }}>
            <span style={{ fontSize: '12px', color: '#08305a', backgroundColor: '#e9f1ff', padding: '4px 10px', borderRadius: '12px', alignSelf: 'flex-start' }}>
              {product.Category}
            </span>
            <h3>{product.Name}</h3>
            <p>Price: <strong>₹{product.Price}</strong></p>
            <p>Stock: {product.Stock}</p>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ marginRight: '10px' }}>Qty:</label>
              <input
                type="number"
                min="1"
                max={product.Stock}
                value={quantities[product.ProductID] || 1}
                onChange={(e) => updateQuantity(product.ProductID, e.target.value)}
                style={{ width: '60px', padding: '5px' }}
              />
            </div>
            <button onClick={() => addToCart(product)} style={{ width: '100%', borderRadius: '8px' }}>Add to Cart</button>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations" style={{ marginTop: '30px' }}>
          <h3>🎯 Recommended For You</h3>
          <p style={{ color: '#666' }}>Based on your cart, you might also like:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {recommendations.map(id => {
              const prod = products.find(p => p.ProductID === id);
              return prod ? (
                <div 
                  key={id} 
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(180deg,#ffffff,#eef6ff)',
                    border: '1px solid rgba(30,111,224,0.12)',
                    borderRadius: '8px',
                    minWidth: '150px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => addToCart(prod)}
                >
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{prod.Name}</p>
                  <p style={{ margin: '0 0 8px 0', color: '#155ecb', fontSize: '16px', fontWeight: 'bold' }}>₹{prod.Price}</p>
                  <small style={{ color: '#999' }}>{prod.Category}</small>
                  <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '12px' }}>Click to add</p>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;