import { useState, useEffect } from 'react';
import axios from 'axios';

const CheckoutSuggestions = ({ cart, onAddToCart }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [minSupport, setMinSupport] = useState(0.05);
  const [minConfidence, setMinConfidence] = useState(0.1);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [addedItems, setAddedItems] = useState(new Set());

  const isOwner = localStorage.getItem('userRole') === 'owner';

  const fetchSuggestions = async (support, confidence) => {
    if (!cart || cart.length === 0) return;

    setLoading(true);
    try {
      const itemIds = cart.map(item => item.ProductID);
      const res = await axios.post('/api/checkout-recommendations', {
        items: itemIds,
        minSupport: support,
        minConfidence: confidence,
      });

      if (res.data && res.data.recommendations) {
        setSuggestions(res.data.recommendations);
        setMetadata(res.data.metadata);
      } else {
        setSuggestions([]);
        setMetadata(null);
      }
    } catch (err) {
      console.error('Error fetching checkout suggestions:', err);
      setSuggestions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await axios.get('/api/settings/ml');
        if (res.data.minSupport != null) setMinSupport(res.data.minSupport);
        if (res.data.minConfidence != null) setMinConfidence(res.data.minConfidence);
      } catch (err) {
        console.error('Error loading global settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (settingsLoaded) {
      fetchSuggestions(minSupport, minConfidence);
    }
  }, [cart, settingsLoaded]);

  const handleSupportChange = (val) => {
    const v = parseFloat(val);
    if (!isNaN(v)) {
      setMinSupport(v);
      fetchSuggestions(v, minConfidence);
    }
  };

  const handleConfidenceChange = (val) => {
    const v = parseFloat(val);
    if (!isNaN(v)) {
      setMinConfidence(v);
      fetchSuggestions(minSupport, v);
    }
  };

  const handleAddItem = (suggestion) => {
    const product = {
      ProductID: suggestion.productId,
      Name: suggestion.name,
      Price: suggestion.price,
      Stock: suggestion.stock,
      Category: suggestion.category,
      quantity: 1,
    };
    onAddToCart(product);
    setAddedItems(prev => new Set([...prev, suggestion.productId]));
  };

  if (!cart || cart.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6 sm:p-8 rounded-3xl border border-indigo-100/50 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
            🧠
          </div>
          <div>
            <h3 className="text-xl font-bold text-indigo-900 mb-1">Frequently Bought Together</h3>
            <p className="text-sm text-indigo-600 font-medium">AI-powered suggestions using Apriori Algorithm</p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              showDetails ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
            }`}
          >
            ⚙️ {showDetails ? 'Hide Settings' : 'Algo Settings'}
          </button>
        )}
      </div>

      {showDetails && isOwner && (
        <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Min Support</label>
              <p className="text-xs text-slate-500 mb-2">(How frequently items appear together)</p>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="0.01" max="0.5" step="0.01" value={minSupport} onChange={(e) => handleSupportChange(e.target.value)}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="font-bold text-indigo-700 min-w-[3rem]">{(minSupport * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Min Confidence</label>
              <p className="text-xs text-slate-500 mb-2">(Probability of buying B given A is bought)</p>
              <div className="flex items-center gap-4">
                <input
                  type="range" min="0.01" max="1.0" step="0.01" value={minConfidence} onChange={(e) => handleConfidenceChange(e.target.value)}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="font-bold text-indigo-700 min-w-[3rem]">{(minConfidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {metadata && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-indigo-100">
              <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200">Algorithm: {metadata.algorithm}</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200">Transactions: {metadata.totalTransactions}</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-slate-600 border border-slate-200">Rules: {metadata.totalRules}</span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-600">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="font-medium animate-pulse">Running Apriori Algorithm...</p>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {suggestions.map((suggestion, index) => {
            const isAdded = addedItems.has(suggestion.productId);
            const confPercent = suggestion.confidence * 100;
            const confColor = confPercent >= 70 ? 'emerald' : confPercent >= 40 ? 'amber' : 'slate';
            
            return (
              <div key={suggestion.productId} className={`bg-white rounded-2xl p-5 border shadow-sm transition-all relative overflow-hidden ${isAdded ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-100 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1'}`}>
                
                <span className={`absolute top-4 right-4 text-[10px] uppercase font-bold px-2 py-1 rounded-full text-white ${confPercent >= 70 ? 'bg-emerald-500' : confPercent >= 40 ? 'bg-amber-500' : 'bg-slate-400'}`}>
                  {confPercent >= 70 ? 'High' : confPercent >= 40 ? 'Medium' : 'Low'} Match
                </span>

                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded mb-2">{suggestion.category}</span>
                <h4 className="font-bold text-slate-800 text-lg mb-1 pr-16 leading-tight">{suggestion.name}</h4>
                <p className="text-xl font-black text-blue-600 mb-4">₹{suggestion.price}</p>

                <div className="space-y-2 mb-4">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Confidence</span>
                      <span className="font-bold text-slate-700">{confPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-${confColor}-500`} style={{ width: `${confPercent}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Support</span>
                      <span className="font-bold text-slate-700">{(suggestion.support * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(suggestion.support * 100 * 5, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {suggestion.antecedentNames && (
                  <div className="bg-indigo-50/50 p-2 rounded-lg text-[10px] text-slate-600 mb-4 border border-indigo-100/50">
                    Bought with <strong className="text-indigo-700">{suggestion.antecedentNames.join(' + ')}</strong>
                  </div>
                )}

                <button
                  onClick={() => !isAdded && handleAddItem(suggestion)}
                  disabled={isAdded}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${isAdded ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
                >
                  {isAdded ? '✓ Added' : '+ Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-500 font-medium">No suggestions right now for these items.</p>
        </div>
      )}
    </div>
  );
};

export default CheckoutSuggestions;
