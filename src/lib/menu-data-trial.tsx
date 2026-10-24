export type DietTag = "veggie" | "vegan" | "nuts" | "sesame";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number; // NGN
  tags: DietTag[];
  image?: string; // optional full item photo — falls back to category image in the modal
  chefNote?: string; // optional short note from the chef, shown in the item modal
};

export type MenuCategory = {
  id: string;
  name: string;
  description?: string;
  image?: string; // parallax band shown at the end of the category
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
        description:
          '"Almost left out of our menu, this beloved dish never quite fit into our dosa or uthappam collection. But perhaps that\'s exactly what makes it so special. Prepared the traditional way our ancestors would have approved of, it is soft, wholesome, nourishing, and wonderfully delicate, a timeless classic that deserves a place of its own" ',
        image:
          "https://res.cloudinary.com/dodmtgsij/image/upload/v1792608305/chatti-catt.jpg",
        items: [
          {
            id: "chatti-idli",
            name: "Chatti Idli",
            description:
              "Soft steamed idlis served in a traditional clay pot with house podi, tempered mustard, curry leaves and warm ghee.",
            price: 12000,
            tags: ["veggie"],
            image:
              "https://res.cloudinary.com/dodmtgsij/image/upload/v1792581405/chatti.jpg",
            chefNote:
              "Tear one open and watch the steam rise from its soft, spongy centre.",
          },
        ],
      },
      {
        id: "dosa-collective",
        name: "The Dosa Collective",
        description:
          "Dosa is a crisp savoury crepe from South India, made from naturally fermented rice and black lentils. A beloved staple enjoyed for breakfast, dinner or as street-side comfort food, now celebrated around the world.",
        image:
          "https://res.cloudinary.com/dodmtgsij/image/upload/v1792616286/dosa-category.jpg",
        items: [
          {
            id: "dosa-classic",
            name: "Classic",
            description:
              "Cultured cow ghee, naturally fermented rice and lentils, served with fresh chutneys and traditional sambar.",
            price: 15000,
            tags: ["veggie"],
            image:
              "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598911/classic.jpg",
            chefNote:
              "Spread paper-thin and cooked until the edges turn lacy, bronze and shatter at the first touch.",
          },
          {
            id: "dosa-signature",
            name: "Signature",
            description:
              "Mashed potatoes, masala, roasted spices and curry leaf on the chef's own fermented batter.",
            price: 17000,
            tags: ["veggie"],
            image:
              "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598914/potatoe.jpg",
            chefNote:
              ": The crisp dosa cracks open onto a warm heart best scooped up by hand.",
          },
          {
            id: "dosa-ammas",
            name: "Amma's",
            description:
              "Cold-pressed sesame and house podi, inspired by traditional home-style South Indian cooking.",
            price: 17000,
            tags: ["veggie", "nuts", "sesame", "vegan"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792601368/ammas.jpg",
            chefNote:
              "Our podi travels to us from our home kitchen in Chennai, coarse, red-brown and smelling of roasted lentils and chilli. ",
          },
          {
            id: "dosa-special",
            name: "Special",
            description:
              "Roasted onions, house podi and Uttukuli cow ghee, with fresh vegetables and aromatic spices.",
            price: 17000,
            tags: ["veggie"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598912/onion-dosa.jpg",
            chefNote:
              "Uttukuli is a small Tamil town famous for its ghee, and you’ll smell why before the plate reaches you.",
          },
          {
            id: "dosa-street",
            name: "Street",
            description:
              "Mushrooms, cracked pepper and butter, packed with spiced vegetables and fresh herbs.",
            price: 20000,
            tags: ["veggie"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598914/mushroom.jpg",
            chefNote:
              "A street-stall dosa at heart, finished with our homemade butter and a crackle of fried curry leaves.",
          },
          {
            id: "dosa-cheese",
            name: "Cheese",
            description:
              "Fresh paneer, cheese and mild spices, filled with melted mozzarella.",
            price: 20000,
            tags: ["veggie"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598914/cheese.jpg",
            chefNote:
              "Our paneer is made every day from fresh cow’s milk, with peppers and onions folded through",
          },
        ],
      },
      {
        id: "uthappam-collective",
        name: "The Uthappam Collective",
        description:
          '"A thicker, soft-centered version of Dosa, slow-cooked with fresh toppings."',
        image:
          "https://res.cloudinary.com/dodmtgsij/image/upload/v1792596606/ut-cat.jpg",
        items: [
          {
            id: "uthappam-onion-podi",
            name: "Onion Podi",
            description:
              "Onions, house podi and cold-pressed sesame oil on a soft South Indian uthappam.",
            price: 17000,
            tags: ["vegan", "nuts"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598913/onion-ut.jpg",
            chefNote:
              "The podi is roasted fresh each morning — it loses its punch after a day.",
          },
          {
            id: "uthappam-beetroot",
            name: "Beetroot",
            description:
              "Beetroot, coriander, green chili and curry leaves, freshly grated with onions and herbs.",
            price: 17000,
            tags: ["vegan"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598908/beetroot.jpg",
            chefNote:
              "The colour is all beetroot — nothing added, nothing dyed.",
          },
          {
            id: "uthappam-garden",
            name: "Garden",
            description:
              "Crisp onions, tomatoes, carrots, coriander and green chillies for a wholesome South Indian meal.",
            price: 17000,
            tags: ["veggie"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792585084/garden-ut.jpg",
            chefNote:
              "Whatever's freshest at the market that week ends up here.",
          },
        ],
      },
      {
        id: "desserts",
        name: "Desserts",
        image:
          "https://res.cloudinary.com/dodmtgsij/image/upload/v1792617076/new_kesari.jpg",
        items: [
          {
            id: "payasam",
            name: "Payasam",
            description:
              "Moong, coconut milk, jaggery and crisp coconut shavings in a rich, creamy pudding.",
            price: 12000,
            tags: ["vegan", "nuts"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598909/payasam.jpg",
            chefNote:
              "Served at every festival in our family — this is the recipe we grew up on.",
          },
          {
            id: "kesari",
            name: "Kesari",
            description:
              "Saffron, ghee and cardamom in a rich South Indian semolina dessert.",
            price: 12000,
            tags: ["veggie", "nuts"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792599170/Kesari.jpg",
            chefNote:
              "A generous pinch of real saffron — you'll see it, not just taste it.",
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
        image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792618060/drinks-cat.jpg",
        items: [
          {
            id: "house-still",
            name: "House Still",
            description: "Pure, crisp still water served chilled.",
            price: 3600,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792617638/house-still.jpg",
          },
          {
            id: "house-sparkling",
            name: "House Sparkling",
            description: "Light sparkling water with a refreshing finish.",
            price: 8000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792617635/house-sparkling.jpg",
          },
          {
            id: "aqua-panna",
            name: "Aqua Panna Still Water",
            description: "Smooth, naturally filtered premium bottled water.",
            price: 4000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792616917/aquapanna.jpg",
          },
          {
            id: "voss-still",
            name: "Voss Still",
            description:
              "Premium Norwegian still water with exceptional purity.",
            price: 6000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792618386/voss-new.jpg",
          },
          {
            id: "perrier",
            name: "Sparkling Perrier",
            description:
              "Naturally sparkling mineral water with a crisp finish.",
            price: 9000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792618385/spark-new.jpg",
          },
          {
            id: "lemonade-mint",
            name: "Lemonade – Mint",
            description:
              "Fresh lemonade with cooling mint and vibrant citrus flavour.",
            price: 10000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792616295/Lemonade-mint-new.jpg",
            chefNote:
              "Muddled to order — the mint should still smell green when it hits the glass.",
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
            description:
              "Refreshing South Indian spiced buttermilk blended with herbs.",
            price: 10000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792602144/spiced-butter.jpg",
            chefNote:
              "Curry leaf and ginger go in last, so they stay fragrant, not boiled out.",
          },
          {
            id: "iced-filter-coffee",
            name: "Signature Iced Filter Coffee",
            description:
              "Rich South Indian filter coffee, slow brewed and served over ice.",
            price: 12000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598904/spiced-butter-milk.jpg",
            chefNote:
              "Brewed hot through a traditional filter first, then cooled — never brewed over ice.",
          },
          {
            id: "lemongrass-iced-tea",
            name: "Cold Brew Lemongrass Iced Tea",
            description:
              "Premium tea with fresh lemongrass and natural citrus notes.",
            price: 10000,
            tags: ["veggie"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598905/lemongrass.jpg",
            chefNote: "Cold-brewed overnight for a smoother, less bitter cup.",
          },
          {
            id: "zafarani-tea",
            name: "Zafarani Tea",
            description: "Premium black tea, saffron and aromatic spices.",
            price: 12000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598904/zafarani.jpg",
            chefNote: "Steeped with whole saffron threads, not extract.",
          },
          {
            id: "masala-chai",
            name: "Masala Chai",
            description:
              "Premium black tea, fresh milk, cardamom, cinnamon, ginger and cloves.",
            price: 12000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792616963/tea-2.jpg",
            chefNote:
              "Our spice blend is ground fresh weekly — it's the first thing regulars notice.",
          },
          {
            id: "house-filter-coffee",
            name: "House Filter Coffee",
            description:
              "Traditionally filter-brewed South Indian coffee, rich aroma and a bold finish.",
            price: 12000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792602142/house-filter.jpg",
            chefNote:
              "Served the traditional way — in a davara and tumbler, poured tableside.",
          },
        ],
      },
    ],
  },
];
