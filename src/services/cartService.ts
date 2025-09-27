import {
  CartSchema,
  CartStateSchema,
  Cart,
  CartState,
  CartItem,
} from "../types/cart";

export class CartService {
  private static readonly API_BASE = "https://share-a-cart.com/api/get/r/cart";

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
   * Fetch cart data from API
   */
  static async fetchCart(cartId: string): Promise<Cart> {
    const url = `${this.API_BASE}/${cartId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate with Zod schema
      const result = CartSchema.safeParse(data);

      if (!result.success) {
        console.warn("Cart data validation issues:", result.error);
        // Still try to use the data, Zod will ignore unknown fields
        return CartSchema.parse(data);
      }

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
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving cart state:", error);
    }
  }

  /**
   * Initialize or update cart state
   */
  static initializeCartState(cart: Cart): CartState {
    const initialCheckedItems: Record<string, boolean> = {};
    const initialQuantities: Record<string, number> = {};

    cart.items.forEach((item: CartItem) => {
      initialCheckedItems[item.asin] = false;
      initialQuantities[item.asin] = item.quantity;
    });

    return {
      cart,
      checkedItems: initialCheckedItems,
      updatedQuantities: initialQuantities,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get or fetch cart data
   */
  static async getOrFetchCart(cartId: string): Promise<CartState> {
    // Try to get from localStorage first
    const stored = this.getCartState(cartId);

    if (stored) {
      // Check if data is not too old (24 hours)
      const isStale = Date.now() - stored.lastUpdated > 24 * 60 * 60 * 1000;

      if (!isStale) {
        return stored;
      }
    }

    // Fetch fresh data from API
    const cart = await this.fetchCart(cartId);
    const newState = this.initializeCartState(cart);

    // Preserve user selections if we had old state
    if (stored) {
      newState.checkedItems = { ...stored.checkedItems };
      newState.updatedQuantities = { ...stored.updatedQuantities };

      // Remove selections for items that no longer exist
      const currentAsins = new Set(cart.items.map((item) => item.asin));
      Object.keys(newState.checkedItems).forEach((asin) => {
        if (!currentAsins.has(asin)) {
          delete newState.checkedItems[asin];
          delete newState.updatedQuantities[asin];
        }
      });
    }

    this.saveCartState(cartId, newState);
    return newState;
  }
}
