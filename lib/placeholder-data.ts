export type RankingCategoryPlaceholder = {
  slug: string;
  title: string;
  description: string;
  surface: string;
};

export const rankingCategories: RankingCategoryPlaceholder[] = [
  {
    slug: "best-daily-trainers",
    title: "Daily Trainers",
    description: "Everyday shoes designed for regular road mileage and dependable comfort.",
    surface: "Road",
  },
  {
    slug: "best-cushioned-running-shoes",
    title: "Cushioned Shoes",
    description: "Shoes that prioritize underfoot protection and a softer ride.",
    surface: "Road",
  },
  {
    slug: "best-stability-running-shoes",
    title: "Stability Shoes",
    description: "Support-focused options built around guided, steady transitions.",
    surface: "Road",
  },
  {
    slug: "best-speed-shoes",
    title: "Speed Shoes",
    description: "Lighter, responsive shoes intended for faster training sessions.",
    surface: "Road",
  },
  {
    slug: "best-long-run-shoes",
    title: "Long Run Shoes",
    description: "Shoes designed to balance protection, comfort, and efficiency over distance.",
    surface: "Road",
  },
  {
    slug: "best-value-running-shoes",
    title: "Value Picks",
    description: "Models evaluated for useful performance relative to purchase price.",
    surface: "Mixed",
  },
];

export const placeholderShoes = [
  {
    brand: "Shoe profile placeholder",
    name: "Everyday Road Trainer",
    category: "Daily trainer",
    tags: ["Road", "Neutral"],
  },
  {
    brand: "Shoe profile placeholder",
    name: "Cushioned Mileage Shoe",
    category: "Cushioned",
    tags: ["Road", "Plush"],
  },
  {
    brand: "Shoe profile placeholder",
    name: "Guided Support Trainer",
    category: "Stability",
    tags: ["Road", "Support"],
  },
  {
    brand: "Shoe profile placeholder",
    name: "Responsive Workout Shoe",
    category: "Speed",
    tags: ["Road", "Workout"],
  },
  {
    brand: "Shoe profile placeholder",
    name: "Long Run Cruiser",
    category: "Long run",
    tags: ["Road", "Distance"],
  },
  {
    brand: "Shoe profile placeholder",
    name: "Versatile Value Trainer",
    category: "Value",
    tags: ["Road", "Versatile"],
  },
];

export const placeholderGuides = [
  {
    category: "Shoe basics",
    title: "How to compare running shoe cushioning",
    description: "A future guide to understanding softness, protection, and ride feel without the marketing noise.",
  },
  {
    category: "Fit and support",
    title: "What stability means in a modern running shoe",
    description: "A planned explanation of support features and the runners who may want to consider them.",
  },
  {
    category: "Training",
    title: "Choosing a shoe for daily miles and long runs",
    description: "A future framework for comparing durability, comfort, and versatility across common training needs.",
  },
];

export function getRankingCategory(slug: string) {
  return rankingCategories.find((category) => category.slug === slug);
}