import { z } from "zod";

// Define the cart item schema
export const CartItemSchema = z
  .object({
    asin: z.string(),
    quantity: z.number(),
    price: z.string(),
    image: z.string(),
    title: z.string(),
    sku: z.string().optional(),
    priceccy: z.string().optional(),
    ccyS: z.string(),
    url: z.string(),
    originalUrl: z.string(),
    savingsBool: z.string(),
    savings: z.any(), // Can be null or other types
    savingsPrice: z.string(),
    newVendorItemURL: z.string(),
  })
  .passthrough(); // Allow unknown fields

// Define vendor cart schema (for matched and original vendor carts)
export const VendorCartSchema = z
  .object({
    matchTo: z.string(),
    matchToDisplayName: z.string(),
    items: z.array(z.any()), // Items array can contain various structures
    splitPriceDiff: z.string().optional(),
    splitItemsTotalPrice: z.string().optional(),
    splitOriginalTotalPrice: z.string().optional(),
    cartCCY: z.string(),
    cartCCYS: z.string(),
  })
  .passthrough(); // Allow unknown fields

// Define the main cart schema
export const CartSchema = z
  .object({
    id: z.string(),
    items: z.array(CartItemSchema),
    store: z.string(),
    referrer: z.string(),
    title: z.string(),
    timestamp: z.number(),
    dest: z.string(),
    vendor: z.string(),
    ap: z.string().optional(),
    ccy: z.string(),
    locale: z.string(),
    cartCCY: z.string(),
    cartCCYS: z.string(),
    cartTotalPrice: z.string(),
    cartTotalQty: z.number(),
    missingCount: z.number(),
    vendorDisplayName: z.string(),
    displaySourceSite: z.string(),
    matchedVendorCart: VendorCartSchema,
    originalVendorCart: VendorCartSchema,
    comparisonPriceDiff: z.string(),
    cheaperCartTotalPrice: z.string(),
    showSplit: z.boolean(),
  })
  .passthrough(); // Allow unknown fields to be ignored

// New Category Schema
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Cart state for local storage
export const CartStateSchema = z
  .object({
    cart: CartSchema,
    checkedItems: z.record(z.string(), z.boolean()), // asin -> checked
    updatedQuantities: z.record(z.string(), z.number()), // asin -> updated quantity
    lastUpdated: z.number(),

    // New fields for categories and ordering
    categories: z.record(z.string(), CategorySchema).default({}),
    categoryOrder: z.array(z.string()).default([]),
    itemCategory: z.record(z.string(), z.string()).default({}), // asin -> categoryId
    itemOrder: z.record(z.string(), z.array(z.string())).default({}), // categoryId -> asin[]

    // UI state
    editMode: z.boolean().default(false),
    completedView: z.enum(["all", "hide", "collapse"]).default("all"),
  })
  .passthrough();

// Export the inferred types
export type CartItem = z.infer<typeof CartItemSchema>;
export type VendorCart = z.infer<typeof VendorCartSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type CartState = z.infer<typeof CartStateSchema>;
export type Category = z.infer<typeof CategorySchema>;
