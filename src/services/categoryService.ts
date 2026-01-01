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

type CategoryKeywordConfig = {
  phrases: string[]; // multi-word phrases or hyphenated terms
  tokens: string[]; // single-word tokens
};

const categoryKeywordConfig: Record<string, CategoryKeywordConfig> = {
  // Avoid generic qualifiers like "fresh" and "organic" to reduce false positives
  produce: {
    phrases: ["spring mix", "green beans", "bell pepper"],
    tokens: [
      "arugula",
      "lettuce",
      "tomato",
      "onion",
      "apple",
      "banana",
      "strawberry",
      "raspberry",
      "avocado",
      "zucchini",
      "carrot",
      "cucumber",
      "pineapple",
      "mango",
      "bean",
      "pepper",
      // Note: rely on phrases for bell pepper and green beans; keep token "pepper" low-impact
    ],
  },
  dairy: {
    phrases: ["goat cheese"],
    tokens: [
      "milk",
      "oatmilk",
      "cheese",
      "yogurt",
      "butter",
      "cream",
      "egg",
      "dairy",
      "fairlife",
      "oatly",
      "babybel",
      "provolone",
    ],
  },
  meat: {
    phrases: [
      "ground beef",
      "lunch meat",
      "shoulder chop",
      "lamb chop",
      "fresh never frozen",
      "never frozen",
    ],
    tokens: [
      "beef",
      "chicken",
      "pork",
      "fish",
      "seafood",
      "meat",
      "lamb",
      "salmon",
      "tuna",
      "shrimp",
      "crab",
      "lobster",
      "fillet",
      "chop",
      "steak",
    ],
  },
  bakery: {
    phrases: [
      "killer bread",
      "sourdough bread",
      "whole grain bread",
      "hamburger buns",
      "hot dog buns",
      "cheese cake",
      "strawberry cheesecake",
    ],
    tokens: [
      "bread",
      "bagel",
      "muffin",
      "pastry",
      "bakery",
      "cake",
      "cheesecake",
      "bun",
      "buns",
      "tortilla",
    ],
  },
  pantry: {
    phrases: [
      "tea bag",
      "tea bags",
      "herbal tea",
      "loose tea",
      "red bean",
      "black bean",
      "kidney bean",
      "pinto bean",
      "navy bean",
      "garbanzo bean",
      "chickpea",
      "canned bean",
      "dried bean",
    ],
    tokens: [
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
      "oat",
      "tea",
    ],
  },
  frozen: {
    phrases: ["ice cream", "frozen food", "frozen meal"],
    tokens: ["frozen", "pizza"],
  },
  beverages: {
    phrases: ["iced tea", "tea drink", "ready to drink"],
    tokens: ["soda", "juice", "water", "coffee", "beverage", "oatmilk"],
  },
  snacks: {
    phrases: ["rold gold", "fresh stacks"],
    tokens: [
      "chips",
      "cracker",
      "cookie",
      "pretzel",
      "popcorn",
      "nuts",
      "snack",
      "ritz",
    ],
  },
  deli: {
    phrases: ["deli slices"],
    tokens: [
      "deli",
      "slice",
      "sliced",
      "tofurky",
      "salami",
      "ham",
      "turkey",
      "provolone",
    ],
  },
  household: {
    phrases: [],
    tokens: [
      "cleaner",
      "soap",
      "shampoo",
      "paper",
      "towels",
      "toilet",
      "household",
    ],
  },
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[®™]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function singularize(token: string): string {
  if (token.endsWith("ies") && token.length > 3) {
    return token.slice(0, -3) + "y";
  }
  if (token.endsWith("es") && token.length > 3) {
    // handle simple plural forms like "slices" -> "slice"
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
}

function extractTokens(input: string): Set<string> {
  const normalized = normalizeText(input);
  const parts = normalized.split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  for (const part of parts) {
    set.add(part);
    set.add(singularize(part));
  }
  return set;
}

function countPhraseMatches(normalized: string, phrases: string[]): number {
  const padded = ` ${normalized} `;
  let count = 0;
  for (const phrase of phrases) {
    const nPhrase = normalizeText(phrase);
    if (nPhrase.length === 0) continue;
    if (padded.includes(` ${nPhrase} `)) {
      count += 1;
    }
  }
  return count;
}

export class CategoryService {
  static mapItemToCategory(item: CartItem): string {
    const normalizedTitle = normalizeText(item.title);
    const titleTokens = extractTokens(item.title);

    let bestCategory = UNCATEGORIZED_ID;
    let bestScore = 0;
    let bestPhraseHits = 0;

    for (const categoryId in categoryKeywordConfig) {
      const config = categoryKeywordConfig[categoryId];

      // Phrase matches are high-signal
      const phraseHits = countPhraseMatches(normalizedTitle, config.phrases);
      let score = phraseHits * 3;

      // Token matches are lower weight
      for (const token of config.tokens) {
        const nToken = normalizeText(token);
        if (nToken && titleTokens.has(nToken)) {
          score += 1;
        }
      }

      if (
        score > bestScore ||
        (score === bestScore && phraseHits > bestPhraseHits) ||
        (score === bestScore &&
          phraseHits === bestPhraseHits &&
          defaultCategoryOrder.indexOf(categoryId) <
            defaultCategoryOrder.indexOf(bestCategory))
      ) {
        bestCategory = categoryId;
        bestScore = score;
        bestPhraseHits = phraseHits;
      }
    }

    return bestCategory;
  }

  static generateNewCategory(name: string) {
    const id = uuidv4();
    return { id, name };
  }
}
