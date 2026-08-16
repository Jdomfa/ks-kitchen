export type DietTag = "veggie" | "vegan" | "nuts" | "sesame";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // NGN
  tags: DietTag[];
};

export type MenuCategory = {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
};

export type MenuTab = {
  id: string;
  label: string;
  categories: MenuCategory[];
};

export const menu: MenuTab[] = [
  {
    id: "food",
    label: "Food",
    categories: [
      {
        id: "comfort-meets-tradition",
        name: "Comfort Meets Tradition",
        description: '"Almost left out of our menu, this beloved dish never quite fit into our dosa or uthappam collection. But perhapsthat\'s exactly what makes it so special. Prepared the traditional way our ancestors would have approved of, it is soft, wholesome, nourishing, andwonderfully delicate—a timeless classic that deserves a place of its own" ',
        items: [
          {
            id: "chatti-idli",
            name: "Chatti Idli",
            description:
              "Soft steamed idlis served in a traditional clay pot with house podi, tempered mustard, curry leaves and warm ghee.",
            price: 15000,
            tags: ["veggie"],
          },
        ],
      },
      {
        id: "dosa-collective",
        name: "The Dosa Collective",
        description: "Dosa is a crisp savoury crepe from South India, made from naturally fermented rice and black lentils. A beloved staple enjoyed for breakfast, dinner or as street-side comfort food, now celebrated around the world.",
        items: [
          {
            id: "dosa-classic",
            name: "Classic",
            description:
              "Cultured cow ghee, naturally fermented rice and lentils, served with fresh chutneys and traditional sambar.",
            price: 15000,
            tags: ["veggie"],
          },
          {
            id: "dosa-signature",
            name: "Signature",
            description:
              "Smashed potatoes, masala, roasted spices and curry leaf on the chef's own fermented batter.",
            price: 15000,
            tags: ["veggie"],
          },
          {
            id: "dosa-ammas",
            name: "Amma's",
            description:
              "Cold-pressed sesame and house podi, inspired by traditional home-style South Indian cooking.",
            price: 15000,
            tags: ["veggie", "nuts", "sesame", "vegan"],
          },
          {
            id: "dosa-special",
            name: "Special",
            description:
              "Roasted onions, house podi and Uttukuli cow ghee, with fresh vegetables and aromatic spices.",
            price: 15000,
            tags: ["veggie"],
          },
          {
            id: "dosa-street",
            name: "Street",
            description:
              "Mushrooms, cracked pepper and butter, packed with spiced vegetables and fresh herbs.",
            price: 15000,
            tags: ["veggie"],
          },
          {
            id: "dosa-cheese",
            name: "Cheese",
            description: "Fresh paneer, cheese and mild spices, filled with melted mozzarella.",
            price: 15000,
            tags: ["veggie"],
          },
        ],
      },
      {
        id: "uthappam-collective",
        name: "The Uthappam Collective",
        description: '"A thicker, soft-centered version of Dosa, slow-cooked with fresh toppings."',
        items: [
          {
            id: "uthappam-onion-podi",
            name: "Onion Podi",
            description:
              "Onions, house podi and cold-pressed sesame oil on a soft South Indian uthappam.",
            price: 16000,
            tags: ["vegan", "nuts"],
          },
          {
            id: "uthappam-beetroot",
            name: "Beetroot",
            description:
              "Beetroot, coriander, green chili and curry leaves, freshly grated with onions and herbs.",
            price: 16000,
            tags: ["vegan"],
          },
          {
            id: "uthappam-garden",
            name: "Garden",
            description:
              "Crisp onions, tomatoes, carrots, coriander and green chillies for a wholesome South Indian meal.",
            price: 16000,
            tags: ["veggie"],
          },
        ],
      },
      {
        id: "desserts",
        name: "Desserts",
        items: [
          {
            id: "payasam",
            name: "Payasam",
            description:
              "Moong, coconut milk, jaggery and crisp coconut shavings in a rich, creamy pudding.",
            price: 12000,
            tags: ["vegan", "nuts"],
          },
          {
            id: "kesari",
            name: "Kesari",
            description: "Saffron, ghee and cardamom in a rich South Indian semolina dessert.",
            price: 12000,
            tags: ["veggie", "nuts"],
          },
        ],
      },
    ],
  },
  {
    id: "drinks",
    label: "Drinks",
    categories: [
      {
        id: "the-bar",
        name: "The Bar",
        items: [
          {
            id: "house-still",
            name: "House Still",
            description: "Pure, crisp still water served chilled.",
            price: 3600,
            tags: [],
          },
          {
            id: "house-sparkling",
            name: "House Sparkling",
            description: "Light sparkling water with a refreshing finish.",
            price: 8000,
            tags: [],
          },
          {
            id: "aqua-panna",
            name: "Aqua Panna Still Water",
            description: "Smooth, naturally filtered premium bottled water.",
            price: 4000,
            tags: [],
          },
          {
            id: "voss-still",
            name: "Voss Still",
            description: "Premium Norwegian still water with exceptional purity.",
            price: 6000,
            tags: [],
          },
          {
            id: "perrier",
            name: "Sparkling Perrier",
            description: "Naturally sparkling mineral water with a crisp finish.",
            price: 9000,
            tags: [],
          },
          {
            id: "lemonade-mint",
            name: "Lemonade – Mint",
            description: "Fresh lemonade with cooling mint and vibrant citrus flavour.",
            price: 10000,
            tags: [],
          },
        ],
      },
      {
        id: "hot-iced",
        name: "Hot & Iced",
        items: [
          {
            id: "spiced-buttermilk",
            name: "Spiced Butter Milk",
            description: "Refreshing South Indian spiced buttermilk blended with herbs.",
            price: 10000,
            tags: [],
          },
          {
            id: "iced-filter-coffee",
            name: "Signature Iced Filter Coffee",
            description: "Rich South Indian filter coffee, slow brewed and served over ice.",
            price: 12000,
            tags: [],
          },
          {
            id: "lemongrass-iced-tea",
            name: "Cold Brew Lemongrass Iced Tea",
            description: "Premium tea with fresh lemongrass and natural citrus notes.",
            price: 10000,
            tags: ["veggie"],
          },
          {
            id: "zafarani-tea",
            name: "Zafarani Tea",
            description: "Premium black tea, saffron and aromatic spices.",
            price: 12000,
            tags: [],
          },
          {
            id: "masala-chai",
            name: "Masala Chai",
            description:
              "Premium black tea, fresh milk, cardamom, cinnamon, ginger and cloves.",
            price: 12000,
            tags: [],
          },
          {
            id: "house-filter-coffee",
            name: "House Filter Coffee",
            description:
              "Traditionally filter-brewed South Indian coffee, rich aroma and a bold finish.",
            price: 10000,
            tags: [],
          },
        ],
      },
    ],
  },
];
