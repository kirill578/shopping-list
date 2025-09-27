import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartService } from '../services/cartService';
import { CartState, CartItem } from '../types/cart';
import { ItemCard } from './ItemCard';

export const HomePage: React.FC = () => {
  const { cartId } = useParams<{ cartId: string }>();
  const navigate = useNavigate();
  const [cartState, setCartState] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cartId) {
      navigate('/');
      return;
    }

    const loadCart = async () => {
      try {
        setLoading(true);
        setError(null);
        const state = await CartService.getOrFetchCart(cartId);
        setCartState(state);
      } catch (err) {
        console.error('Error loading cart:', err);
        setError('Failed to load shopping cart. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [cartId, navigate]);

  const handleItemCheck = (asin: string, checked: boolean) => {
    if (!cartState || !cartId) return;

    const newState = {
      ...cartState,
      checkedItems: {
        ...cartState.checkedItems,
        [asin]: checked,
      },
      lastUpdated: Date.now(),
    };

    setCartState(newState);
    CartService.saveCartState(cartId, newState);
  };

  const handleQuantityChange = (asin: string, quantity: number) => {
    if (!cartState || !cartId) return;

    const newState = {
      ...cartState,
      updatedQuantities: {
        ...cartState.updatedQuantities,
        [asin]: quantity,
      },
      lastUpdated: Date.now(),
    };

    setCartState(newState);
    CartService.saveCartState(cartId, newState);
  };

  const getCheckedItemsCount = () => {
    if (!cartState) return 0;
    return Object.values(cartState.checkedItems).filter(Boolean).length;
  };

  const getTotalPrice = () => {
    if (!cartState) return '0.00';
    
    let total = 0;
    cartState.cart.items.forEach((item: CartItem) => {
      if (cartState.checkedItems[item.asin]) {
        const quantity = cartState.updatedQuantities[item.asin] || item.quantity;
        const price = parseFloat(item.price) || 0;
        total += price * quantity;
      }
    });
    
    return total.toFixed(2);
  };

  if (loading) {
    return (
      <div className="homepage">
        <div className="container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading your shopping cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage">
        <div className="container">
          <div className="error">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="back-button">
              Try Another Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cartState) {
    return (
      <div className="homepage">
        <div className="container">
          <div className="error">
            <h2>Cart not found</h2>
            <p>The shopping cart could not be loaded.</p>
            <button onClick={() => navigate('/')} className="back-button">
              Try Another Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { cart } = cartState;
  const checkedCount = getCheckedItemsCount();
  const totalPrice = getTotalPrice();

  return (
    <div className="homepage">
      <div className="container">
        <header className="cart-header">
          <button onClick={() => navigate('/')} className="back-link">
            ← Back
          </button>
          <div className="cart-info">
            <h1>{cart.title || 'Shopping List'}</h1>
            <div className="cart-meta">
              <span className="vendor">{cart.vendorDisplayName}</span>
              <span className="total-items">{cart.items.length} items</span>
            </div>
            <div className="cart-totals">
              <div className="original-total">
                Original Total: {cart.cartCCYS}{cart.cartTotalPrice}
              </div>
              {checkedCount > 0 && (
                <div className="selected-total">
                  Selected ({checkedCount} items): {cart.cartCCYS}{totalPrice}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="items-list">
          {cart.items.map((item: CartItem) => (
            <ItemCard
              key={item.asin}
              item={item}
              checked={cartState.checkedItems[item.asin] || false}
              quantity={cartState.updatedQuantities[item.asin] || item.quantity}
              onCheck={(checked) => handleItemCheck(item.asin, checked)}
              onQuantityChange={(quantity) => handleQuantityChange(item.asin, quantity)}
            />
          ))}
        </div>

        {cart.items.length === 0 && (
          <div className="empty-cart">
            <p>This cart is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};
