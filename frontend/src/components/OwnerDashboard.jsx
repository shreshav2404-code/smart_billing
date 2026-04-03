import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-800">Owner Dashboard</h2>
                    <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">Admin Panel</span>
                </div>
                <button onClick={handleLogout} className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl font-bold transition-all">
                    Logout
                </button>
            </div>

            {/* Analytics */}
            {analyticsData && (
                <div className="mb-10">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0">💰</div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
                                <h3 className="text-2xl font-black text-slate-800">₹{analyticsData.kpis.totalRevenue?.toLocaleString() || 0}</h3>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0">📦</div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Orders</p>
                                <h3 className="text-2xl font-black text-slate-800">{analyticsData.kpis.totalOrders}</h3>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shrink-0">🛍️</div>
                            <div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Items Sold</p>
                                <h3 className="text-2xl font-black text-slate-800">{analyticsData.kpis.totalItemsSold}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Daily Revenue Trend</h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer>
                                    <LineChart data={analyticsData.revenueOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                                        <YAxis tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={{stroke: '#e2e8f0'}} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                                        <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Top Products</h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer>
                                    <BarChart data={analyticsData.topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" tick={{fontSize: 11, fill: '#94a3b8'}} axisLine={{stroke: '#e2e8f0'}} tickLine={false} />
                                        <YAxis dataKey="name" type="category" tick={{fontSize: 10, fill: '#334155'}} axisLine={{stroke: '#e2e8f0'}} tickLine={false} width={70} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                        <Bar dataKey="totalSold" fill="#06b6d4" barSize={16} radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-8">
                        <h3 className="font-bold text-slate-800 mb-4">Revenue by Category</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={analyticsData.categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={90} fill="#8884d8" dataKey="value">
                                        {analyticsData.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product + Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-800 mb-6 pb-3 border-b-2 border-indigo-500 inline-block">Add New Product</h3>
                    <form onSubmit={handleAddProduct} className="flex flex-col gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Name</label>
                            <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Price (₹)</label>
                                <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1">Stock</label>
                                <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Category</label>
                            <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Select Category</option>
                                <option value="Groceries">Groceries</option>
                                <option value="Sports">Sports</option>
                                <option value="Medical">Medical</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Beauty">Beauty</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-1">Weight (kg)</label>
                            <input type="number" step="0.01" value={newProduct.weight} onChange={e => setNewProduct({ ...newProduct, weight: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all mt-2">
                            Add Product
                        </button>
                    </form>
                </div>

                {/* Inventory */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 pb-3 border-b-2 border-amber-500 inline-block">Manage Inventory</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                        {products.map(product => (
                            <div key={product.ProductID} className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative">
                                <span className="absolute -top-2 right-3 text-[10px] font-bold uppercase bg-slate-700 text-white px-2 py-0.5 rounded-full">{product.Category}</span>
                                <h4 className="font-bold text-slate-800 mb-4 pr-16 text-sm">{product.Name}</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                                        <span className="text-xs font-bold text-slate-400">Price (₹)</span>
                                        <div className="flex items-center">
                                            <button onClick={() => handleUpdateProduct(product.ProductID, 'price', Math.max(0, product.Price - 10))} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-l-lg text-slate-600 font-bold text-sm transition-colors">-</button>
                                            <input type="number" value={product.Price} onChange={(e) => handleUpdateProduct(product.ProductID, 'price', Number(e.target.value))} className="w-14 text-center border-y border-slate-200 py-1 text-sm font-bold text-slate-700 focus:outline-none" />
                                            <button onClick={() => handleUpdateProduct(product.ProductID, 'price', product.Price + 10)} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-r-lg text-slate-600 font-bold text-sm transition-colors">+</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                                        <span className="text-xs font-bold text-slate-400">Stock</span>
                                        <div className="flex items-center">
                                            <button onClick={() => handleUpdateProduct(product.ProductID, 'stock', Math.max(0, product.Stock - 1))} disabled={product.Stock <= 0} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-l-lg text-slate-600 font-bold text-sm transition-colors disabled:opacity-30">-</button>
                                            <input type="number" value={product.Stock} onChange={(e) => handleUpdateProduct(product.ProductID, 'stock', Number(e.target.value))} className={`w-14 text-center border-y border-slate-200 py-1 text-sm font-bold focus:outline-none ${product.Stock <= 5 ? 'text-red-500' : 'text-slate-700'}`} />
                                            <button onClick={() => handleUpdateProduct(product.ProductID, 'stock', product.Stock + 1)} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-r-lg text-slate-600 font-bold text-sm transition-colors">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ML Settings */}
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-3xl p-6 sm:p-8 border border-indigo-100/50 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30 shrink-0">🧠</div>
                    <div>
                        <h3 className="text-xl font-bold text-indigo-900">ML Recommendation Settings</h3>
                        <p className="text-sm text-indigo-600 font-medium">Configure Apriori Algorithm & Association Rule Mining</p>
                    </div>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/50 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Min Support</label>
                            <p className="text-xs text-slate-500 mb-3">(How frequently items appear together in transactions)</p>
                            <div className="flex items-center gap-4">
                                <input type="range" min="0.01" max="0.5" step="0.01" value={mlMinSupport} onChange={e => setMlMinSupport(parseFloat(e.target.value))} className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                <span className="font-bold text-indigo-700 min-w-[3rem] text-right">{(mlMinSupport * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Min Confidence</label>
                            <p className="text-xs text-slate-500 mb-3">(Probability of buying B given A is already in cart)</p>
                            <div className="flex items-center gap-4">
                                <input type="range" min="0.01" max="1.0" step="0.01" value={mlMinConfidence} onChange={e => setMlMinConfidence(parseFloat(e.target.value))} className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                <span className="font-bold text-indigo-700 min-w-[3rem] text-right">{(mlMinConfidence * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Simulated Cart */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Simulated Cart (select products to test)</label>
                        <div className="flex flex-wrap gap-2 mb-5">
                            {products.slice(0, 15).map(p => (
                                <button
                                    key={p.ProductID}
                                    onClick={() => toggleMlTestItem(p.ProductID)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        mlTestItems.includes(p.ProductID)
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                    }`}
                                >
                                    {p.Name}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={runMlTest}
                                disabled={mlTestItems.length === 0 || mlLoading}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                            >
                                {mlLoading ? '⏳ Running Apriori...' : '🔬 Run Algorithm Test'}
                            </button>
                            <button
                                onClick={saveMlSettings}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                            >
                                💾 Save Global ML Settings
                            </button>
                        </div>
                    </div>
                </div>

                {/* ML Results */}
                {mlResults && (
                    <div className="bg-white/80 rounded-2xl p-6 border border-indigo-100/50">
                        {mlResults.metadata && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {Object.entries(mlResults.metadata).map(([key, val]) => (
                                    <span key={key} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs">
                                        <span className="text-slate-400 font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="font-bold text-slate-700">{val}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {mlResults.recommendations && mlResults.recommendations.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mlResults.recommendations.map((rec, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{rec.category}</span>
                                                <h4 className="font-bold text-slate-800 mt-1 text-sm">{rec.name}</h4>
                                                <p className="font-black text-blue-600">₹{rec.price}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${rec.confidence >= 0.7 ? 'bg-emerald-500' : rec.confidence >= 0.4 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                                                {(rec.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 space-y-0.5">
                                            <span className="block">Support: <strong className="text-slate-700">{(rec.support * 100).toFixed(1)}%</strong></span>
                                            <span className="block">Lift: <strong className="text-purple-600">{rec.lift?.toFixed(2)}x</strong></span>
                                            {rec.antecedentNames && <span className="block">Rule: <strong>{rec.antecedentNames.join(' + ')}</strong> → {rec.name}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-400 py-6">No recommendations found. Try lowering thresholds or selecting different products.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;
