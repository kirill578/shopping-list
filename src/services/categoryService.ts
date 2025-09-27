import { CartItem } from "../types/cart";
import { v4 as uuidv4 } from "uuid";

export const UNCATEGORIZED_ID = "uncategorized";

export const defaultCategories = {
  [UNCATEGORIZED_ID]: { id: UNCATEGORIZED_ID, name: "Uncategorized" },
  produce: { id: "produce", name: "Produce" },
  dairy: { id: "dairy", name: "Dairy & Eggs" },
  meat: { id: "meat", name: "Meat & Seafood" },
  bakery: { id: "bakery", name: "Bakery" },
  pantry: { id: "pantry", name: "Pantry" },
  frozen: { id: "frozen", name: "Frozen" },
  beverages: { id: "beverages", name: "Beverages" },
  snacks: { id: "snacks", name: "Snacks" },
  deli: { id: "deli", name: "Deli" },
  household: { id: "household", name: "Household" },
};

export const defaultCategoryOrder = [
  "produce",
  "dairy",
  "meat",
  "bakery",
  "pantry",
  "frozen",
  "beverages",
  "snacks",
  "deli",
  "household",
  UNCATEGORIZED_ID,
];

const categoryKeywords: Record<string, string[]> = {
  produce: [
    "fresh",
    "organic",
    "produce",
    "fruit",
    "vegetable",
    "greens",
    "lettuce",
    "tomato",
    "onion",
    "apple",
    "banana",
    "berries",
    "avocado",
    "zucchini",
    "carrots",
    "cucumber",
    "pepper",
    "pineapple",
    "mango",
  ],
  dairy: [
    "milk",
    "cheese",
    "yogurt",
    "butter",
    "cream",
    "eggs",
    "dairy",
    "fairlife",
    "oatly",
  ],
  meat: ["beef", "chicken", "pork", "fish", "seafood", "meat", "ground beef"],
  bakery: ["bread", "bagel", "muffin", "pastry", "bakery", "killer bread"],
  pantry: [
    "sauce",
    "pasta",
    "rice",
    "canned",
    "soup",
    "spice",
    "oil",
    "vinegar",
    "flour",
    "sugar",
    "cereal",
    "oats",
  ],
  frozen: ["frozen", "ice cream", "pizza"],
  beverages: ["soda", "juice", "water", "tea", "coffee", "beverage", "oatmilk"],
  snacks: [
    "chips",
    "crackers",
    "cookies",
    "pretzels",
    "popcorn",
    "nuts",
    "snack",
    "ritz",
    "rold gold",
  ],
  deli: ["deli", "sliced", "tofurky", "salami", "ham", "turkey"],
  household: [
    "cleaner",
    "soap",
    "shampoo",
    "paper towels",
    "toilet paper",
    "household",
  ],
};

export class CategoryService {
  static mapItemToCategory(item: CartItem): string {
    const title = item.title.toLowerCase();

    for (const categoryId in categoryKeywords) {
      const keywords = categoryKeywords[categoryId];
      if (keywords.some((keyword) => title.includes(keyword))) {
        return categoryId;
      }
    }

    return UNCATEGORIZED_ID;
  }

  static generateNewCategory(name: string) {
    const id = uuidv4();
    return { id, name };
  }
}
