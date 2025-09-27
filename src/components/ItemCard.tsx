import React from "react";
import { CartItem, Category } from "../types/cart";

interface ItemCardProps {
  item: CartItem;
  checked: boolean;
  quantity: number;
  onCheck: (checked: boolean) => void;
  onQuantityChange: (quantity: number) => void;
  editMode: boolean;
  categories: Category[];
  itemCategoryId: string;
  onMoveItem: (direction: "up" | "down") => void;
  onChangeCategory: (newCategoryId: string) => void;
}

interface ThinItemCardProps {
  item: CartItem;
  checked: boolean;
  onCheck: (checked: boolean) => void;
}

export const ThinItemCard: React.FC<ThinItemCardProps> = ({
  item,
  checked,
  onCheck,
}) => {
  return (
    <div className={`thin-item-card ${checked ? "checked" : ""}`}>
      <div className="item-checkbox-container">
        <input
          type="checkbox"
          className="item-checkbox"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          id={`check-thin-${item.asin}`}
        />
        <label htmlFor={`check-thin-${item.asin}`} className="checkbox-label">
          <span className="checkmark"></span>
        </label>
      </div>
      <div className="thin-item-title">
        {item.title}
      </div>
    </div>
  );
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  checked,
  quantity,
  onCheck,
  onQuantityChange,
  editMode,
  categories,
  itemCategoryId,
  onMoveItem,
  onChangeCategory,
}) => {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = Math.max(0, parseInt(e.target.value) || 0);
    onQuantityChange(newQuantity);
  };

  const incrementQuantity = () => {
    onQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    onQuantityChange(Math.max(0, quantity - 1));
  };

  const openItemLink = () => {
    if (item.originalUrl) {
      window.open(item.originalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`item-card ${checked ? "checked" : ""}`}>
      {editMode && (
        <div className="item-edit-controls">
          <div className="item-reorder-controls">
            <button onClick={() => onMoveItem("up")}>↑</button>
            <button onClick={() => onMoveItem("down")}>↓</button>
          </div>
          <div className="item-category-select">
            <select
              onChange={(e) => onChangeCategory(e.target.value)}
              value={itemCategoryId}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="item-checkbox-container">
        <input
          type="checkbox"
          className="item-checkbox"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          id={`check-${item.asin}`}
        />
        <label htmlFor={`check-${item.asin}`} className="checkbox-label">
          <span className="checkmark"></span>
        </label>
      </div>

      <div className="item-image-container">
        <img
          src={item.image}
          alt={item.title}
          className="item-image"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </div>

      <div className="item-details">
        <div className="item-title-section">
          <h3 className="item-title" onClick={openItemLink}>
            {item.title}
          </h3>
          <div className="item-meta">
            <span className="item-sku">{item.sku}</span>
            {item.savingsBool && (
              <span className="savings-badge">
                {item.savingsPrice && `Save ${item.ccyS}${item.savingsPrice}`}
              </span>
            )}
          </div>
        </div>

        <div className="item-actions">
          <div className="item-price">
            <span className="currency">{item.ccyS}</span>
            <span className="price">{item.price}</span>
          </div>

          {editMode ? (
            <div className="quantity-controls">
              <button
                type="button"
                className="quantity-btn decrease"
                onClick={decrementQuantity}
                disabled={quantity <= 0 || !editMode}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                onChange={handleQuantityChange}
                min="0"
                max="999"
                aria-label="Quantity"
                disabled={!editMode}
              />
              <button
                type="button"
                className="quantity-btn increase"
                onClick={incrementQuantity}
                aria-label="Increase quantity"
                disabled={!editMode}
              >
                +
              </button>
            </div>
          ) : (
            <div className="quantity-display">
              <span className="quantity-label">Qty:</span>
              <span className="quantity-value">{quantity}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
