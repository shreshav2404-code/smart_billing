import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const readCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('cart'));
    return Array.isArray(saved) ? saved.filter((item) => item && item.ProductID != null) : [];
  } catch {
    return [];
  }
};

const maxFor = (product) => (Number.isFinite(product?.Stock) && product.Stock > 0 ? product.Stock : Infinity);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [items, setItems] = useState(readCart);
  const hadSession = useRef(Boolean(token));

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Signing out empties the cart (it belongs to the session that filled it).
  useEffect(() => {
    if (hadSession.current && !token) setItems([]);
    hadSession.current = Boolean(token);
  }, [token]);

  // Adds up to the known stock. Returns how many units actually went in.
  const addItem = useCallback((product, quantity = 1) => {
    const existing = items.find((item) => item.ProductID === product.ProductID);
    const current = existing?.quantity || 0;
    const next = Math.min(current + quantity, maxFor(product));
    const added = Math.max(next - current, 0);
    if (added === 0) return 0;
    setItems((prev) => {
      const found = prev.some((item) => item.ProductID === product.ProductID);
      if (found) {
        return prev.map((item) => (item.ProductID === product.ProductID ? { ...item, quantity: next } : item));
      }
      const { ProductID, Name, Price, Category, Stock } = product;
      return [...prev, { ProductID, Name, Price, Category, Stock, quantity: next }];
    });
    return added;
  }, [items]);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((prev) => prev.map((item) => {
      if (item.ProductID !== productId) return item;
      const clamped = Math.max(1, Math.min(Math.floor(quantity) || 1, maxFor(item)));
      return { ...item, quantity: clamped };
    }));
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.ProductID !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const total = items.reduce((sum, item) => sum + item.Price * (item.quantity || 1), 0);
    const quantityOf = (productId) => items.find((item) => item.ProductID === productId)?.quantity || 0;
    return { items, count, total, quantityOf, addItem, setQuantity, removeItem, clear };
  }, [items, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};
