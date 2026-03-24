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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return '#059669';
    if (confidence >= 0.4) return '#d97706';
    return '#6b7280';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.4) return 'Medium';
    return 'Low';
  };

  if (!cart || cart.length === 0) return null;

  return (
    <div className="checkout-suggestions">
      {/* Header */}
      <div className="suggestions-header">
        <div className="suggestions-title-row">
          <div className="suggestions-icon">🧠</div>
          <div>
            <h3 className="suggestions-title">Frequently Bought Together</h3>
            <p className="suggestions-subtitle">
              AI-powered suggestions using <strong>Apriori Algorithm</strong> &amp; Association Rule Mining
            </p>
          </div>
        </div>

        {/* Algorithm Controls — Owner Only */}
        {isOwner && (
          <div className="algo-controls">
            <button
              className={`algo-toggle ${showDetails ? 'active' : ''}`}
              onClick={() => setShowDetails(!showDetails)}
            >
              ⚙️ {showDetails ? 'Hide' : 'Show'} Algorithm Settings
            </button>
          </div>
        )}

        {showDetails && (
          <div className="algo-settings">
            <div className="algo-setting-group">
              <div className="algo-setting">
                <label>
                  Min Support
                  <span className="algo-hint">
                    (How frequently items appear together)
                  </span>
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={minSupport}
                    onChange={(e) => handleSupportChange(e.target.value)}
                    className="algo-slider"
                  />
                  <span className="slider-value">{(minSupport * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="algo-setting">
                <label>
                  Min Confidence
                  <span className="algo-hint">
                    (Probability of buying B given A is bought)
                  </span>
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={minConfidence}
                    onChange={(e) => handleConfidenceChange(e.target.value)}
                    className="algo-slider"
                  />
                  <span className="slider-value">{(minConfidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Algorithm Metadata */}
            {metadata && (
              <div className="algo-metadata">
                <div className="metadata-chip">
                  <span className="chip-label">Algorithm</span>
                  <span className="chip-value">{metadata.algorithm}</span>
                </div>
                <div className="metadata-chip">
                  <span className="chip-label">Transactions</span>
                  <span className="chip-value">{metadata.totalTransactions}</span>
                </div>
                <div className="metadata-chip">
                  <span className="chip-label">Rules Found</span>
                  <span className="chip-value">{metadata.totalRules}</span>
                </div>
                <div className="metadata-chip">
                  <span className="chip-label">Frequent Itemsets</span>
                  <span className="chip-value">{metadata.totalFrequentItemsets}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggestions Grid */}
      {loading ? (
        <div className="suggestions-loading">
          <div className="loading-spinner"></div>
          <p>Running Apriori algorithm...</p>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="suggestions-grid">
          {suggestions.map((suggestion, index) => {
            const isAdded = addedItems.has(suggestion.productId);
            return (
              <div
                key={suggestion.productId}
                className={`suggestion-card ${isAdded ? 'added' : ''}`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {/* Confidence Badge */}
                <div
                  className="confidence-badge"
                  style={{ backgroundColor: getConfidenceColor(suggestion.confidence) }}
                >
                  {getConfidenceLabel(suggestion.confidence)} Match
                </div>

                {/* Product Info */}
                <div className="suggestion-product-info">
                  <span className="suggestion-category">{suggestion.category}</span>
                  <h4 className="suggestion-name">{suggestion.name}</h4>
                  <p className="suggestion-price">₹{suggestion.price}</p>
                </div>

                {/* Association Rule Info */}
                <div className="suggestion-rule-info">
                  <div className="rule-stat">
                    <div className="rule-stat-bar">
                      <div
                        className="rule-stat-fill confidence-fill"
                        style={{ width: `${suggestion.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="rule-stat-text">
                      <span>Confidence</span>
                      <strong>{(suggestion.confidence * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                  <div className="rule-stat">
                    <div className="rule-stat-bar">
                      <div
                        className="rule-stat-fill support-fill"
                        style={{ width: `${Math.min(suggestion.support * 100 * 5, 100)}%` }}
                      ></div>
                    </div>
                    <div className="rule-stat-text">
                      <span>Support</span>
                      <strong>{(suggestion.support * 100).toFixed(1)}%</strong>
                    </div>
                  </div>
                  {suggestion.lift && (
                    <div className="rule-stat-lift">
                      <span>Lift: </span>
                      <strong>{suggestion.lift.toFixed(2)}x</strong>
                    </div>
                  )}
                </div>

                {/* Association Rule explanation */}
                {suggestion.antecedentNames && (
                  <div className="rule-explanation">
                    <span className="rule-arrow-label">
                      People who bought <strong>{suggestion.antecedentNames.join(' + ')}</strong> also bought this
                    </span>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  className={`suggestion-add-btn ${isAdded ? 'added' : ''}`}
                  onClick={() => !isAdded && handleAddItem(suggestion)}
                  disabled={isAdded}
                >
                  {isAdded ? '✓ Added to Cart' : '+ Add to Cart'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-suggestions">
          <p>No suggestions available for the current cart items and algorithm parameters.</p>
          <p style={{ fontSize: '13px', opacity: 0.7 }}>
            Try lowering the minimum support or confidence thresholds.
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckoutSuggestions;
