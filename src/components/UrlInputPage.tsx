import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartService } from '../services/cartService';

export const UrlInputPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cartId = CartService.extractCartIdFromUrl(url.trim());
      
      if (!cartId) {
        setError('Invalid URL format. Please enter a valid share-a-cart.com URL (e.g., https://share-a-cart.com/get/T4GEU) or cart ID.');
        setIsLoading(false);
        return;
      }

      // Navigate to the cart page
      navigate(`/${cartId}`);
    } catch (err) {
      setError('Failed to process the URL. Please try again.');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(''); // Clear error when user starts typing
  };

  return (
    <div className="url-input-page">
      <div className="container">
        <div className="header">
          <h1>Shopping List</h1>
          <p>Enter your share-a-cart.com link to view your shopping list</p>
        </div>

        <form onSubmit={handleSubmit} className="url-form">
          <div className="input-group">
            <label htmlFor="cart-url">Cart URL or ID</label>
            <input
              id="cart-url"
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="https://share-a-cart.com/get/T4GEU or T4GEU"
              className={error ? 'error' : ''}
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            disabled={!url.trim() || isLoading}
            className="submit-button"
          >
            {isLoading ? 'Loading...' : 'View Shopping List'}
          </button>
        </form>

        <div className="example">
          <h3>Examples:</h3>
          <ul>
            <li>https://share-a-cart.com/get/T4GEU</li>
            <li>T4GEU</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
