import {
  CartSchema,
  CartStateSchema,
  Cart,
  CartState,
  CartItem,
} from "../types/cart";
import {
  CategoryService,
  defaultCategories,
  defaultCategoryOrder,
} from "./categoryService";

export class CartService {
  private static readonly API_BASE = "https://share-a-cart.com/api/get/r/cart";
  private static readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;
  private static readonly CACHE_KEY_PREFIX = "cart-cache-";

  /**
   * Get cached cart data if valid
   */
  private static getCachedCart(cartId: string): Cart | null {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${cartId}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);

      // Check if cache has expired
      if (
        parsed.timestamp &&
        Date.now() - parsed.timestamp > this.CACHE_EXPIRY_MS
      ) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Validate cached data with Zod schema
      const result = CartSchema.safeParse(parsed.data);

      if (!result.success) {
        console.warn(
          "Cached cart data failed validation, removing from cache:",
          result.error
        );
        localStorage.removeItem(cacheKey);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error("Error reading cached cart:", error);
      return null;
    }
  }

  /**
   * Cache validated cart data
   */
  private static setCachedCart(cartId: string, cart: Cart): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${cartId}`;
      const cacheData = {
        data: cart,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error caching cart:", error);
    }
  }

  /**
   * Clear cached cart data
   */
  static clearCachedCart(cartId: string): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${cartId}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error("Error clearing cached cart:", error);
    }
  }

  /**
   * Clear all cached cart data
   */
  static clearAllCachedCarts(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error clearing all cached carts:", error);
    }
  }

  /**
   * Extract cart ID from share-a-cart URL
   */
  static extractCartIdFromUrl(url: string): string | null {
    const patterns = [
      /https:\/\/share-a-cart\.com\/get\/([A-Z0-9]+)/i,
      /^([A-Z0-9]+)$/i, // Direct cart ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].toUpperCase();
      }
    }

    return null;
  }

  /**
   * Fetch cart data from API or cache
   */
  static async fetchCart(cartId: string): Promise<Cart> {
    // Check cache first
    const cachedCart = this.getCachedCart(cartId);
    if (cachedCart) {
      console.log("Using cached cart data for:", cartId);
      return cachedCart;
    }

    console.log("Fetching fresh cart data for:", cartId);
    const url = `${this.API_BASE}/${cartId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            `Cart "${cartId}" not found. Please check the cart ID or URL.`
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Log the actual response for debugging
      console.log("API Response:", data);

      // Check if response is empty or null
      if (!data || typeof data !== "object") {
        throw new Error(`Invalid response from API: ${JSON.stringify(data)}`);
      }

      // Check if API returned an error
      if (data.error) {
        throw new Error(
          `API Error: ${data.error}. The cart "${cartId}" may have expired or doesn't exist.`
        );
      }

      // Validate with Zod schema
      const result = CartSchema.safeParse(data);

      if (!result.success) {
        console.error("Cart data validation failed:", result.error);
        console.error("Received data:", data);
        throw new Error(
          `Invalid cart data format. Please check if the cart ID "${cartId}" is correct.`
        );
      }

      // Cache the validated data
      this.setCachedCart(cartId, result.data);

      return result.data;
    } catch (error) {
      console.error("Error fetching cart:", error);
      throw error;
    }
  }

  /**
   * Get cart state from localStorage
   */
  static getCartState(cartId: string): CartState | null {
    try {
      const key = `${cartId}-state`;
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);
      const result = CartStateSchema.safeParse(parsed);

      if (!result.success) {
        console.warn("Invalid stored cart state, clearing:", result.error);
        localStorage.removeItem(key);

        // Attempt to recover checked items from old structure if possible
        if ("checkedItems" in parsed) {
          localStorage.setItem(
            `${cartId}-checked`,
            JSON.stringify({ checkedItems: parsed.checkedItems })
          );
        }

        return null;
      }

      return result.data;
    } catch (error) {
      console.error("Error getting cart state:", error);
      return null;
    }
  }

  /**
   * Save cart state to localStorage
   */
  static saveCartState(cartId: string, state: CartState): void {
    try {
      const key = `${cartId}-state`;
      const checkedKey = `${cartId}-checked`;

      // Save full state
      localStorage.setItem(key, JSON.stringify(state));

      // Save minimal checked items backup for recovery
      localStorage.setItem(
        checkedKey,
        JSON.stringify({
          checkedItems: state.checkedItems,
          lastUpdated: state.lastUpdated,
        })
      );
    } catch (error) {
      console.error("Error saving cart state:", error);
    }
  }

  /**
   * Initialize or update cart state
   */
  static initializeCartState(cart: Cart): CartState {
    const itemCategory: Record<string, string> = {};
    const itemOrder: Record<string, string[]> = {};
    const initialQuantities: Record<string, number> = {};

    defaultCategoryOrder.forEach((id) => {
      itemOrder[id] = [];
    });

    cart.items.forEach((item: CartItem) => {
      const categoryId = CategoryService.mapItemToCategory(item);
      itemCategory[item.asin] = categoryId;
      if (!itemOrder[categoryId]) {
        itemOrder[categoryId] = [];
      }
      itemOrder[categoryId].push(item.asin);
      initialQuantities[item.asin] = item.quantity;
    });

    return {
      cart,
      checkedItems: {},
      updatedQuantities: initialQuantities,
      lastUpdated: Date.now(),
      categories: defaultCategories,
      categoryOrder: defaultCategoryOrder,
      itemCategory: itemCategory,
      itemOrder: itemOrder,
      editMode: false,
      completedView: "all",
    };
  }

  /**
   * Get or fetch cart data
   */
  static async getOrFetchCart(cartId: string): Promise<CartState> {
    const stored = this.getCartState(cartId);

    if (stored) {
      return stored;
    }

    // Fetch fresh data from API
    const cart = await this.fetchCart(cartId);
    const newState = this.initializeCartState(cart);

    // Check for recovered checked items
    const checkedItemsFallback = localStorage.getItem(`${cartId}-checked`);
    if (checkedItemsFallback) {
      try {
        const parsed = JSON.parse(checkedItemsFallback);
        if (parsed && typeof parsed.checkedItems === "object") {
          newState.checkedItems = parsed.checkedItems;
        }
      } catch (e) {
        console.error("Error parsing checked items fallback", e);
      } finally {
        localStorage.removeItem(`${cartId}-checked`);
      }
    }

    // Note: stored is null here, so we only use the fallback checked items above

    this.saveCartState(cartId, newState);
    return newState;
  }
}
