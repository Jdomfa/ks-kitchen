import type { DietTag } from "./menu-data";

export type Product = {
  id: string;
  name: string;
  description: string;
  size: string;
  price: number; // NGN — PLACEHOLDER, confirm real pricing before launch
  tags: DietTag[];
};

// Sourced from the "Branding Mockups" pantry jar lineup in the Brand
// Guidelines PDF. Prices are placeholders — swap in real numbers.
export const products: Product[] = [
  {
    id: "house-podi",
    name: "House Podi",
    description:
      "Kala's signature spice blend — the everyday finishing podi served with every dosa and idli in the restaurant.",
    size: "150g",
    price: 6500,
    tags: ["vegan", "nuts", "sesame"],
  },
  {
    id: "idli-podi",
    name: "Idli Podi",
    description: "A milder, lentil-forward podi made specifically to pair with steamed idli.",
    size: "150g",
    price: 6500,
    tags: ["vegan", "nuts", "sesame"],
  },
  {
    id: "coconut-chutney",
    name: "Coconut Chutney",
    description: "Freshly ground coconut chutney, made the same way it's served in-house.",
    size: "200g",
    price: 5000,
    tags: ["vegan", "nuts", "sesame"],
  },
  {
    id: "cultured-cow-ghee",
    name: "Cultured Cow Ghee",
    description: "Slow-cultured cow ghee, the base of nearly everything on the menu.",
    size: "200ml",
    price: 9000,
    tags: ["vegan"],
  },
  {
    id: "filter-coffee-blend",
    name: "Filter Coffee Blend",
    description: "The house filter coffee blend, ground for a traditional South Indian brew.",
    size: "200g",
    price: 7000,
    tags: ["vegan"],
  },
  {
    id: "sesame-podi",
    name: "Sesame Podi",
    description: "Cold-pressed sesame podi — the same blend used in Amma's dosa.",
    size: "150g",
    price: 6500,
    tags: ["vegan", "nuts", "sesame"],
  },
];
