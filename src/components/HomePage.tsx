import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartService } from "../services/cartService";
import { CategoryService } from "../services/categoryService";
import { CartState, CartItem } from "../types/cart";
import { ItemCard, ThinItemCard } from "./ItemCard";
import { TopBar } from "./TopBar";

interface CategoryHeaderProps {
  categoryName: string;
  onRename: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddItem: () => void;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  categoryName,
  onRename,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddItem,
}) => {
  return (
    <div className="category-header-edit">
      <h2 className="category-title">{categoryName}</h2>
      <div className="category-actions">
        <button onClick={onAddItem}>+ Item</button>
        <button onClick={onRename}>Rename</button>
        <button onClick={onDelete}>Delete</button>
        <button onClick={onMoveUp}>↑</button>
        <button onClick={onMoveDown}>↓</button>
      </div>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const { cartId } = useParams<{ cartId: string }>();
  const navigate = useNavigate();
  const [cartState, setCartState] = useState<CartState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cartId) {
      navigate("/");
      return;
    }

    const loadCart = async () => {
      try {
        setLoading(true);
        setError(null);
        const state = await CartService.getOrFetchCart(cartId);
        setCartState(state);
      } catch (err) {
        console.error("Error loading cart:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load shopping cart. Please try again.";
        setError(errorMessage);
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
    if (!cartState || !cartId || !cartState.editMode) return; // prevent change in non-edit mode

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

  const handleToggleEditMode = () => {
    if (!cartState || !cartId) return;
    const newState = { ...cartState, editMode: !cartState.editMode };
    setCartState(newState);
    CartService.saveCartState(cartId, newState);
  };

  const handleCompletedViewChange = (view: "all" | "hide" | "collapse") => {
    if (!cartState || !cartId) return;
    const newState = { ...cartState, completedView: view };
    setCartState(newState);
    CartService.saveCartState(cartId, newState);
  };

  const handleClearAllState = () => {
    if (!cartState || !cartId) return;
    if (
      !confirm(
        "This will remove all your local changes for this cart. Continue?"
      )
    )
      return;
    localStorage.removeItem(`${cartId}-state`);
    localStorage.removeItem(`${cartId}-checked`);
    // Reload fresh from API
    setLoading(true);
    CartService.getOrFetchCart(cartId)
      .then((state) => setCartState(state))
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  };

  const handleClearAllButChecked = () => {
    if (!cartState || !cartId) return;
    if (
      !confirm(
        "This will reset everything except which items are checked. Continue?"
      )
    )
      return;

    const checkedBackup = { ...cartState.checkedItems };

    localStorage.removeItem(`${cartId}-state`);
    // keep `${cartId}-checked` purposely (CartService will reapply it)
    localStorage.setItem(
      `${cartId}-checked`,
      JSON.stringify({ checkedItems: checkedBackup, lastUpdated: Date.now() })
    );

    setLoading(true);
    CartService.getOrFetchCart(cartId)
      .then((state) => setCartState(state))
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  };

  const handleRenameCategory = (categoryId: string) => {
    if (!cartState || !cartId) return;
    const newName = prompt(
      "Enter new category name:",
      cartState.categories[categoryId].name
    );
    if (newName) {
      const newState = {
        ...cartState,
        categories: {
          ...cartState.categories,
          [categoryId]: { ...cartState.categories[categoryId], name: newName },
        },
      };
      setCartState(newState);
      CartService.saveCartState(cartId, newState);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!cartState || !cartId || categoryId === "uncategorized") {
      alert("Cannot delete the default 'Uncategorized' category.");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this category? Items will be moved to Uncategorized."
      )
    ) {
      const newState = { ...cartState };
      const itemsToMove = newState.itemOrder[categoryId] || [];

      // Move items to Uncategorized
      newState.itemOrder["uncategorized"] = [
        ...newState.itemOrder["uncategorized"],
        ...itemsToMove,
      ];
      itemsToMove.forEach((asin) => {
        newState.itemCategory[asin] = "uncategorized";
      });

      // Remove category
      delete newState.categories[categoryId];
      delete newState.itemOrder[categoryId];
      newState.categoryOrder = newState.categoryOrder.filter(
        (id) => id !== categoryId
      );

      setCartState(newState);
      CartService.saveCartState(cartId, newState);
    }
  };

  const handleMoveCategory = (categoryId: string, direction: "up" | "down") => {
    if (!cartState || !cartId) return;

    const { categoryOrder } = cartState;
    const index = categoryOrder.indexOf(categoryId);

    if (
      (direction === "up" && index > 0) ||
      (direction === "down" && index < categoryOrder.length - 1)
    ) {
      const newOrder = [...categoryOrder];
      const to = direction === "up" ? index - 1 : index + 1;
      [newOrder[index], newOrder[to]] = [newOrder[to], newOrder[index]]; // Swap

      const newState = { ...cartState, categoryOrder: newOrder };
      setCartState(newState);
      CartService.saveCartState(cartId, newState);
    }
  };

  const handleAddItem = (categoryId: string) => {
    if (!cartState || !cartId) return;

    const title = prompt("Enter item name:");
    if (!title) return;

    const quantityStr = prompt("Enter quantity:", "1");
    const quantity = parseInt(quantityStr || "1", 10);
    if (isNaN(quantity) || quantity <= 0) {
      alert("Invalid quantity.");
      return;
    }

    const newItem: CartItem = {
      asin: `custom-${new Date().getTime()}-${Math.random()}`,
      title,
      quantity,
      price: "0.00",
      image: "",
      sku: "Custom",
      priceccy: cartState.cart.cartCCY,
      ccyS: cartState.cart.cartCCYS,
      url: "",
      originalUrl: "",
      savingsBool: "",
      savings: null,
      savingsPrice: "",
      newVendorItemURL: "",
    };

    const newState = { ...cartState };

    newState.cart.items.push(newItem);
    newState.itemOrder[categoryId].push(newItem.asin);
    newState.itemCategory[newItem.asin] = categoryId;
    newState.checkedItems[newItem.asin] = false;
    newState.updatedQuantities[newItem.asin] = quantity;

    setCartState(newState);
    CartService.saveCartState(cartId, newState);
  };

  const handleMoveItem = (
    asin: string,
    categoryId: string,
    direction: "up" | "down"
  ) => {
    if (!cartState || !cartId) return;

    const { itemOrder } = cartState;
    const items = itemOrder[categoryId];
    const index = items.indexOf(asin);

    if (
      (direction === "up" && index > 0) ||
      (direction === "down" && index < items.length - 1)
    ) {
      const newItems = [...items];
      const to = direction === "up" ? index - 1 : index + 1;
      [newItems[index], newItems[to]] = [newItems[to], newItems[index]];

      const newState = {
        ...cartState,
        itemOrder: {
          ...itemOrder,
          [categoryId]: newItems,
        },
      };
      setCartState(newState);
      CartService.saveCartState(cartId, newState);
    }
  };

  const handleChangeItemCategory = (
    asin: string,
    oldCategoryId: string,
    newCategoryId: string
  ) => {
    if (!cartState || !cartId || oldCategoryId === newCategoryId) return;

    const newState = { ...cartState };

    // Remove from old category
    newState.itemOrder[oldCategoryId] = newState.itemOrder[
      oldCategoryId
    ].filter((id) => id !== asin);

    // Add to new category
    if (!newState.itemOrder[newCategoryId]) {
      newState.itemOrder[newCategoryId] = [];
    }
    newState.itemOrder[newCategoryId].push(asin);

    // Update item's category mapping
    newState.itemCategory[asin] = newCategoryId;

    setCartState(newState);
    CartService.saveCartState(cartId, newState);
  };

  const getCheckedItemsCount = () => {
    if (!cartState) return 0;
    return Object.values(cartState.checkedItems).filter(Boolean).length;
  };

  const getTotalPrice = () => {
    if (!cartState) return "0.00";

    let total = 0;
    const allItems = cartState.cart.items.reduce((acc, item) => {
      acc[item.asin] = item;
      return acc;
    }, {} as Record<string, CartItem>);

    Object.keys(cartState.checkedItems).forEach((asin) => {
      if (cartState.checkedItems[asin]) {
        const item = allItems[asin];
        if (item) {
          const quantity = cartState.updatedQuantities[asin] || item.quantity;
          const price = parseFloat(item.price) || 0;
          total += price * quantity;
        }
      }
    });

    return total.toFixed(2);
  };

  const visibleItemsByCategory = useMemo(() => {
    if (!cartState) return { active: {}, completed: {}, all: {}, mixed: {} };

    const { completedView, checkedItems, itemOrder, cart } = cartState;
    const allItems = cart.items.reduce((acc, item) => {
      acc[item.asin] = item;
      return acc;
    }, {} as Record<string, CartItem>);

    const active: Record<string, CartItem[]> = {};
    const completed: Record<string, CartItem[]> = {};
    const all: Record<string, CartItem[]> = {};
    const mixed: Record<string, CartItem[]> = {}; // For collapse view - items in original order

    Object.keys(itemOrder).forEach((catId) => {
      const items = itemOrder[catId]
        .map((asin) => allItems[asin])
        .filter(Boolean);

      if (completedView === "all") {
        // "all" view: preserve original order
        all[catId] = items;
        active[catId] = [];
        completed[catId] = [];
        mixed[catId] = [];
      } else if (completedView === "collapse") {
        // "collapse" view: items in original order, will render thin completed items inline
        mixed[catId] = items;
        active[catId] = [];
        completed[catId] = [];
        all[catId] = [];
      } else {
        // "hide" view: separate active and completed, show completed in collapsible section
        active[catId] = items.filter((item) => !checkedItems[item.asin]);
        completed[catId] = items.filter((item) => checkedItems[item.asin]);
        all[catId] = [];
        mixed[catId] = [];
      }
    });

    return { active, completed, all, mixed };
  }, [cartState]);

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
            <button onClick={() => navigate("/")} className="back-button">
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
            <button onClick={() => navigate("/")} className="back-button">
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
    <div className={`homepage ${cartState.editMode ? "edit-mode" : ""}`}>
      <div className="container">
        <TopBar
          editMode={cartState.editMode}
          onToggleEditMode={handleToggleEditMode}
          completedView={cartState.completedView}
          onCompletedViewChange={handleCompletedViewChange}
          checkedCount={checkedCount}
          totalPrice={totalPrice}
          cartCCYS={cart.cartCCYS}
          onNavigateBack={() => navigate("/")}
          onClearAllState={handleClearAllState}
          onClearAllButChecked={handleClearAllButChecked}
        />
        <header className="cart-header">
          <div className="cart-info">
            <h1>{cart.title || "Shopping List"}</h1>
            <div className="cart-meta">
              <span className="vendor">{cart.vendorDisplayName}</span>
              <span className="total-items">{cart.items.length} items</span>
            </div>
          </div>
        </header>

        {cartState.editMode && (
          <div className="add-category-section">
            <button
              className="add-category-btn"
              onClick={() => {
                const name = prompt("Enter new category name:");
                if (name) {
                  const newCategory = CategoryService.generateNewCategory(name);
                  const newState = {
                    ...cartState,
                    categories: {
                      ...cartState.categories,
                      [newCategory.id]: newCategory,
                    },
                    categoryOrder: [...cartState.categoryOrder, newCategory.id],
                    itemOrder: {
                      ...cartState.itemOrder,
                      [newCategory.id]: [],
                    },
                  };
                  setCartState(newState);
                  CartService.saveCartState(cartId!, newState);
                }
              }}
            >
              + Add Category
            </button>
          </div>
        )}

        <div className="items-list">
          {cartState.categoryOrder.map((categoryId) => {
            const category = cartState.categories[categoryId];
            const activeItems = visibleItemsByCategory.active[categoryId] || [];
            const completedItems =
              visibleItemsByCategory.completed[categoryId] || [];
            const allItems = visibleItemsByCategory.all[categoryId] || [];
            const mixedItems = visibleItemsByCategory.mixed[categoryId] || [];

            const hasItems =
              cartState.completedView === "all"
                ? allItems.length > 0
                : cartState.completedView === "collapse"
                ? mixedItems.length > 0
                : activeItems.length > 0 || completedItems.length > 0;

            // Hide empty categories unless in edit mode
            if (!category || (!hasItems && !cartState.editMode)) return null;

            return (
              <div key={categoryId} className="category-section">
                {cartState.editMode ? (
                  <CategoryHeader
                    categoryName={`${category.name} (${
                      cartState.completedView === "all"
                        ? allItems.length
                        : cartState.completedView === "collapse"
                        ? mixedItems.length
                        : activeItems.length + completedItems.length
                    })`}
                    onRename={() => handleRenameCategory(categoryId)}
                    onDelete={() => handleDeleteCategory(categoryId)}
                    onMoveUp={() => handleMoveCategory(categoryId, "up")}
                    onMoveDown={() => handleMoveCategory(categoryId, "down")}
                    onAddItem={() => handleAddItem(categoryId)}
                  />
                ) : (
                  <h2 className="category-title">
                    {category.name} (
                    {cartState.completedView === "all"
                      ? allItems.length
                      : cartState.completedView === "collapse"
                      ? mixedItems.length
                      : activeItems.length + completedItems.length}
                    )
                    {completedItems.length > 0 &&
                      cartState.completedView !== "all" &&
                      cartState.completedView !== "collapse" && (
                        <span className="completed-count">
                          {" "}
                          - {completedItems.length} done
                        </span>
                      )}
                  </h2>
                )}

                {/* Items in original order for "all" view */}
                {cartState.completedView === "all" && (
                  <div className="category-items">
                    {allItems.map((item: CartItem) => (
                      <ItemCard
                        key={item.asin}
                        item={item}
                        checked={cartState.checkedItems[item.asin] || false}
                        quantity={
                          cartState.updatedQuantities[item.asin] ||
                          item.quantity
                        }
                        onCheck={(checked) =>
                          handleItemCheck(item.asin, checked)
                        }
                        onQuantityChange={(quantity) =>
                          handleQuantityChange(item.asin, quantity)
                        }
                        editMode={cartState.editMode}
                        categories={Object.values(cartState.categories)}
                        itemCategoryId={cartState.itemCategory[item.asin]}
                        onMoveItem={(direction) =>
                          handleMoveItem(item.asin, categoryId, direction)
                        }
                        onChangeCategory={(newCatId) =>
                          handleChangeItemCategory(
                            item.asin,
                            categoryId,
                            newCatId
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Items in original order for "collapse" view - thin items for completed */}
                {cartState.completedView === "collapse" && (
                  <div className="category-items">
                    {mixedItems.map((item: CartItem) => {
                      const isCompleted =
                        cartState.checkedItems[item.asin] || false;

                      if (isCompleted) {
                        return (
                          <ThinItemCard
                            key={item.asin}
                            item={item}
                            checked={true}
                            onCheck={(checked) =>
                              handleItemCheck(item.asin, checked)
                            }
                          />
                        );
                      } else {
                        return (
                          <ItemCard
                            key={item.asin}
                            item={item}
                            checked={false}
                            quantity={
                              cartState.updatedQuantities[item.asin] ||
                              item.quantity
                            }
                            onCheck={(checked) =>
                              handleItemCheck(item.asin, checked)
                            }
                            onQuantityChange={(quantity) =>
                              handleQuantityChange(item.asin, quantity)
                            }
                            editMode={cartState.editMode}
                            categories={Object.values(cartState.categories)}
                            itemCategoryId={cartState.itemCategory[item.asin]}
                            onMoveItem={(direction) =>
                              handleMoveItem(item.asin, categoryId, direction)
                            }
                            onChangeCategory={(newCatId) =>
                              handleChangeItemCategory(
                                item.asin,
                                categoryId,
                                newCatId
                              )
                            }
                          />
                        );
                      }
                    })}
                  </div>
                )}

                {/* Active Items for "hide" view */}
                {cartState.completedView === "hide" && (
                  <div className="category-items">
                    {activeItems.map((item: CartItem) => (
                      <ItemCard
                        key={item.asin}
                        item={item}
                        checked={cartState.checkedItems[item.asin] || false}
                        quantity={
                          cartState.updatedQuantities[item.asin] ||
                          item.quantity
                        }
                        onCheck={(checked) =>
                          handleItemCheck(item.asin, checked)
                        }
                        onQuantityChange={(quantity) =>
                          handleQuantityChange(item.asin, quantity)
                        }
                        editMode={cartState.editMode}
                        categories={Object.values(cartState.categories)}
                        itemCategoryId={cartState.itemCategory[item.asin]}
                        onMoveItem={(direction) =>
                          handleMoveItem(item.asin, categoryId, direction)
                        }
                        onChangeCategory={(newCatId) =>
                          handleChangeItemCategory(
                            item.asin,
                            categoryId,
                            newCatId
                          )
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Completed Items for "hide" view - collapsible section */}
                {completedItems.length > 0 &&
                  cartState.completedView === "hide" && (
                    <details className="completed-section">
                      <summary className="completed-summary">
                        {completedItems.length} completed item
                        {completedItems.length !== 1 ? "s" : ""}
                      </summary>
                      <div className="category-items completed-items">
                        {completedItems.map((item: CartItem) => (
                          <ItemCard
                            key={item.asin}
                            item={item}
                            checked={cartState.checkedItems[item.asin] || false}
                            quantity={
                              cartState.updatedQuantities[item.asin] ||
                              item.quantity
                            }
                            onCheck={(checked) =>
                              handleItemCheck(item.asin, checked)
                            }
                            onQuantityChange={(quantity) =>
                              handleQuantityChange(item.asin, quantity)
                            }
                            editMode={cartState.editMode}
                            categories={Object.values(cartState.categories)}
                            itemCategoryId={cartState.itemCategory[item.asin]}
                            onMoveItem={(direction) =>
                              handleMoveItem(item.asin, categoryId, direction)
                            }
                            onChangeCategory={(newCatId) =>
                              handleChangeItemCategory(
                                item.asin,
                                categoryId,
                                newCatId
                              )
                            }
                          />
                        ))}
                      </div>
                    </details>
                  )}
              </div>
            );
          })}
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
