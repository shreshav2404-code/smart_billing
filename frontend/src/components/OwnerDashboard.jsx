import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const OwnerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '', weight: '' });
    const [mlMinSupport, setMlMinSupport] = useState(0.05);
    const [mlMinConfidence, setMlMinConfidence] = useState(0.3);
    const [mlTestItems, setMlTestItems] = useState([]);
    const [mlLoading, setMlLoading] = useState(false);
    const [mlResults, setMlResults] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const navigate = useNavigate();

    const toggleMlTestItem = (productId) => {
        setMlTestItems(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const runMlTest = async () => {
        setMlLoading(true);
        setMlResults(null);
        try {
            const selectedProducts = products.filter(p => mlTestItems.includes(p.ProductID));
            const res = await axios.post('/api/checkout-recommendations', {
                items: selectedProducts.map(p => p.ProductID),
                minSupport: mlMinSupport,
                minConfidence: mlMinConfidence
            });
            setMlResults(res.data);
        } catch (err) {
            console.error('ML test error:', err);
            setMlResults({ recommendations: [], metadata: { error: 'Failed to run algorithm' } });
        }
        setMlLoading(false);
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const fetchMlSettings = async () => {
        try {
            const res = await axios.get('/api/settings/ml');
            if (res.data.minSupport != null) setMlMinSupport(res.data.minSupport);
            if (res.data.minConfidence != null) setMlMinConfidence(res.data.minConfidence);
        } catch (err) {
            console.error('Error fetching ML settings:', err);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/analytics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalyticsData(res.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        }
    };

    const saveMlSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/settings/ml', { minSupport: mlMinSupport, minConfidence: mlMinConfidence }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('ML Settings saved globally! These will now apply to the customer checkout pages.');
        } catch (err) {
            alert('Failed to save settings');
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchMlSettings();
        fetchAnalytics();
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
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
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

            {/* Analytics Dashboard Section */}
            {analyticsData && (
                <div style={{ marginBottom: '40px' }}>
                    
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ fontSize: '24px', background: '#e3f2fd', color: '#1976d2', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>💰</div>
                            <div>
                                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold' }}>Total Revenue</p>
                                <h3 style={{ margin: '5px 0 0 0', color: '#2c3e50', fontSize: '24px' }}>₹{analyticsData.kpis.totalRevenue?.toLocaleString() || 0}</h3>
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ fontSize: '24px', background: '#e8f5e9', color: '#388e3c', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>📦</div>
                            <div>
                                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold' }}>Total Orders</p>
                                <h3 style={{ margin: '5px 0 0 0', color: '#2c3e50', fontSize: '24px' }}>{analyticsData.kpis.totalOrders}</h3>
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ fontSize: '24px', background: '#fff3e0', color: '#f57c00', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>🛍️</div>
                            <div>
                                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold' }}>Items Sold</p>
                                <h3 style={{ margin: '5px 0 0 0', color: '#2c3e50', fontSize: '24px' }}>{analyticsData.kpis.totalItemsSold}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) minmax(300px, 1fr)', gap: '30px' }}>
                        
                        {/* Revenue Over Time Line Chart */}
                        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>Daily Revenue Trend</h3>
                            <div style={{ height: 300, width: '100%' }}>
                                <ResponsiveContainer>
                                    <LineChart data={analyticsData.revenueOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#7f8c8d'}} axisLine={{stroke: '#ddd'}} tickLine={false} />
                                        <YAxis tick={{fontSize: 12, fill: '#7f8c8d'}} axisLine={{stroke: '#ddd'}} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Line type="monotone" dataKey="revenue" stroke="#3498db" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Products Bar Chart */}
                        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>Top Selling Products</h3>
                            <div style={{ height: 300, width: '100%' }}>
                                <ResponsiveContainer>
                                    <BarChart data={analyticsData.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#eee" />
                                        <XAxis type="number" tick={{fontSize: 12, fill: '#7f8c8d'}} axisLine={{stroke: '#ddd'}} tickLine={false} />
                                        <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#2c3e50'}} axisLine={{stroke: '#ddd'}} tickLine={false} />
                                        <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="totalSold" fill="#2ecc71" barSize={20} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Category Breakdown Pie Chart */}
                        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee', gridColumn: '1 / -1' }}>
                            <h3 style={{ marginTop: 0, color: '#2c3e50', marginBottom: '20px' }}>Revenue by Category</h3>
                            <div style={{ height: 300, width: '100%' }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={analyticsData.categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                                            {analyticsData.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>
            )}

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

            {/* ML Recommendation Algorithm Settings */}
            <div style={{ marginTop: '30px', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f5f0ff 100%)', padding: '28px', borderRadius: '16px', border: '1px solid rgba(30,111,224,0.12)', boxShadow: '0 4px 20px rgba(13,71,161,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '28px', background: 'linear-gradient(135deg, #2b7be9, #7c3aed)', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(43,123,233,0.25)' }}>🧠</div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700, color: '#0d47a1', textAlign: 'left' }}>ML Recommendation Settings</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', textAlign: 'left' }}>Configure <strong>Apriori Algorithm</strong> &amp; Association Rule Mining parameters</p>
                    </div>
                </div>

                {/* Parameters */}
                <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(30,111,224,0.08)', marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', textAlign: 'left' }}>
                                Min Support
                                <span style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: '#94a3b8', marginTop: '2px' }}>(How frequently items appear together in transactions)</span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input type="range" min="0.01" max="0.5" step="0.01" value={mlMinSupport} onChange={e => setMlMinSupport(parseFloat(e.target.value))} className="algo-slider" style={{ flex: 1 }} />
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#2b7be9', minWidth: '42px', textAlign: 'right' }}>{(mlMinSupport * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', textAlign: 'left' }}>
                                Min Confidence
                                <span style={{ display: 'block', fontSize: '11px', fontWeight: 400, color: '#94a3b8', marginTop: '2px' }}>(Probability of buying B given A is already in cart)</span>
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input type="range" min="0.01" max="1.0" step="0.01" value={mlMinConfidence} onChange={e => setMlMinConfidence(parseFloat(e.target.value))} className="algo-slider" style={{ flex: 1 }} />
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#2b7be9', minWidth: '42px', textAlign: 'right' }}>{(mlMinConfidence * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Simulated Cart */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '10px', textAlign: 'left' }}>
                            Simulated Cart (select products to test)
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {products.slice(0, 15).map(p => (
                                <button
                                    key={p.ProductID}
                                    onClick={() => toggleMlTestItem(p.ProductID)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                                        borderColor: mlTestItems.includes(p.ProductID) ? '#2b7be9' : '#e2e8f0',
                                        background: mlTestItems.includes(p.ProductID) ? 'linear-gradient(90deg, #2b7be9, #155ecb)' : 'white',
                                        color: mlTestItems.includes(p.ProductID) ? 'white' : '#475569',
                                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s', width: 'auto',
                                        boxShadow: mlTestItems.includes(p.ProductID) ? '0 2px 8px rgba(43,123,233,0.25)' : 'none',
                                    }}
                                >
                                    {p.Name}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={runMlTest}
                            disabled={mlTestItems.length === 0 || mlLoading}
                            style={{
                                padding: '10px 24px', borderRadius: '10px', border: 'none',
                                background: mlTestItems.length === 0 ? '#e2e8f0' : 'linear-gradient(90deg, #7c3aed, #6d28d9)',
                                color: mlTestItems.length === 0 ? '#94a3b8' : 'white',
                                fontSize: '14px', fontWeight: 700, cursor: mlTestItems.length === 0 ? 'not-allowed' : 'pointer',
                                width: 'auto', transition: 'all 0.2s',
                            }}
                        >
                            {mlLoading ? '⏳ Running Apriori...' : '🔬 Run Algorithm Test'}
                        </button>
                        <button
                            onClick={saveMlSettings}
                            style={{
                                padding: '10px 24px', borderRadius: '10px', border: 'none', marginLeft: '12px',
                                background: 'linear-gradient(90deg, #059669, #10b981)', color: 'white',
                                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                                width: 'auto', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                            }}
                        >
                            💾 Save Global ML Settings
                        </button>
                    </div>
                </div>

                {/* ML Results */}
                {mlResults && (
                    <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(30,111,224,0.08)' }}>
                        {/* Metadata */}
                        {mlResults.metadata && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                                {Object.entries(mlResults.metadata).map(([key, val]) => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid rgba(30,111,224,0.1)', borderRadius: '20px', padding: '5px 14px', fontSize: '12px' }}>
                                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span style={{ color: '#1e293b', fontWeight: 700 }}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recommendation Results */}
                        {mlResults.recommendations && mlResults.recommendations.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                                {mlResults.recommendations.map((rec, i) => (
                                    <div key={i} style={{ background: 'white', border: '1px solid rgba(30,111,224,0.08)', borderRadius: '12px', padding: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#08305a', background: '#e9f1ff', padding: '2px 8px', borderRadius: '8px' }}>{rec.category}</span>
                                                <h4 style={{ margin: '6px 0 2px 0', fontSize: '15px', color: '#1e293b' }}>{rec.name}</h4>
                                                <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#2b7be9', textAlign: 'left' }}>₹{rec.price}</p>
                                            </div>
                                            <div style={{ background: rec.confidence >= 0.7 ? '#059669' : rec.confidence >= 0.4 ? '#d97706' : '#6b7280', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                                                {(rec.confidence * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            <span>Support: <strong style={{ color: '#475569' }}>{(rec.support * 100).toFixed(1)}%</strong></span>
                                            <span>Lift: <strong style={{ color: '#7c3aed' }}>{rec.lift?.toFixed(2)}x</strong></span>
                                            {rec.antecedentNames && <span>Rule: <strong>{rec.antecedentNames.join(' + ')}</strong> → {rec.name}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#94a3b8' }}>No recommendations found. Try lowering thresholds or selecting different products.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;
