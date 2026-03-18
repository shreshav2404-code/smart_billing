import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || []);
  const [recommendations, setRecommendations] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const navigate = useNavigate();

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
        <button onClick={handleLogout} style={{ width: 'auto', padding: '10px 18px' }}>Logout</button>
      </div>

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