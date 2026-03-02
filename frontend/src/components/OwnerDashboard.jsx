import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OwnerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '', weight: '' });
    const navigate = useNavigate();

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleUpdateProduct = async (id, field, value) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/products/${id}`, { [field]: value }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProducts();
        } catch (err) {
            alert('Failed to update product');
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/products', newProduct, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Product added successfully!');
            setNewProduct({ name: '', price: '', stock: '', category: '', weight: '' });
            fetchProducts();
        } catch (err) {
            alert('Failed to add product');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#1a1a2e', fontSize: '28px', margin: 0 }}>Owner Dashboard <span style={{ fontSize: '14px', backgroundColor: '#e9e9f0', padding: '4px 10px', borderRadius: '12px', verticalAlign: 'middle' }}>Admin</span></h2>
                <button onClick={handleLogout} style={{ backgroundColor: '#eb4d4b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'transform 0.2s' }}>
                    Logout
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '30px' }}>
                {/* Add Product Form */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', height: 'fit-content' }}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', display: 'inline-block' }}>Add New Product</h3>
                    <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>Name</label>
                            <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>Price (₹)</label>
                                <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>Stock Limit</label>
                                <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>Category</label>
                            <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: 'white' }}>
                                <option value="">Select Category</option>
                                <option value="Groceries">Groceries</option>
                                <option value="Sports">Sports</option>
                                <option value="Medical">Medical</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Beauty">Beauty</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontSize: '14px', fontWeight: 'bold' }}>Weight (kg)</label>
                            <input type="number" step="0.01" value={newProduct.weight} onChange={e => setNewProduct({ ...newProduct, weight: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                        </div>
                        <button type="submit" style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', transition: 'background-color 0.2s' }}>
                            Add Product to Store
                        </button>
                    </form>
                </div>

                {/* Product Inventory Management */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #f39c12', paddingBottom: '10px', display: 'inline-block' }}>Manage Inventory</h3>

                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {products.map(product => (
                            <div key={product.ProductID} style={{ border: '1px solid #e1e8ed', borderRadius: '8px', padding: '15px', position: 'relative', transition: 'box-shadow 0.2s', backgroundColor: '#fafbfc' }}>
                                <div style={{ fontSize: '12px', color: '#ffffff', backgroundColor: '#34495e', padding: '3px 8px', borderRadius: '12px', position: 'absolute', top: '-10px', right: '15px' }}>
                                    {product.Category}
                                </div>
                                <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '18px' }}>{product.Name}</h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #eee' }}>
                                        <span style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: 'bold' }}>Price (₹)</span>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <button onClick={() => handleUpdateProduct(product.ProductID, 'price', Math.max(0, product.Price - 10))} style={{ padding: '4px 8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', borderRadius: '4px 0 0 4px', cursor: 'pointer' }}>-</button>
                                            <input
                                                type="number"
                                                value={product.Price}
                                                onChange={(e) => handleUpdateProduct(product.ProductID, 'price', Number(e.target.value))}
                                                style={{ width: '60px', textAlign: 'center', border: '1px solid #ddd', borderLeft: 'none', borderRight: 'none', padding: '4px 0' }}
                                            />
                                            <button onClick={() => handleUpdateProduct(product.ProductID, 'price', product.Price + 10)} style={{ padding: '4px 8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>+</button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', padding: '8px', borderRadius: '6px', border: '1px solid #eee' }}>
                                        <span style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: 'bold' }}>Stock Qty</span>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <button onClick={() => handleUpdateProduct(product.ProductID, 'stock', Math.max(0, product.Stock - 1))} style={{ padding: '4px 8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', borderRadius: '4px 0 0 4px', cursor: 'pointer', color: product.Stock <= 0 ? '#ccc' : 'inherit' }} disabled={product.Stock <= 0}>-</button>
                                            <input
                                                type="number"
                                                value={product.Stock}
                                                onChange={(e) => handleUpdateProduct(product.ProductID, 'stock', Number(e.target.value))}
                                                style={{ width: '60px', textAlign: 'center', border: '1px solid #ddd', borderLeft: 'none', borderRight: 'none', padding: '4px 0', color: product.Stock <= 5 ? '#e74c3c' : 'inherit', fontWeight: product.Stock <= 5 ? 'bold' : 'normal' }}
                                            />
                                            <button onClick={() => handleUpdateProduct(product.ProductID, 'stock', product.Stock + 1)} style={{ padding: '4px 8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
