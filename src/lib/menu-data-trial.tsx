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
            price: 18000,
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
            price: 18000,
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
              "Made the way it is at home, from the last of the batter: thick, tangy and edged with a crisp, toasted crust.",
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
              "The beetroot bleeds deep magenta into the batter as it cooks, sweet and earthy against the chilli’s bite.",
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
              "Our lightest uthappam, a confetto of colour pressed into the batter, soft below and still crunchy on top.",
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
              "We dry-roast the moong first for a toasty depth, the way it’s made for festivals and wedding feasts back home.",
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
              "The sweet Tamil homes make when good news arrives, glowing gold and best eaten warm.",
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
        ]
      },
      {
        id: "chilled",
        name: "Chilled",
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
            id: "aqua-panna",
            name: "Aqua Panna Still 200ml",
            description: "Smooth, naturally filtered premium bottled water from Tuscany.",
            price: 4000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792616917/aquapanna.jpg",
          },
          {
            id: "aqua-panna-large",
            name: "Aqua Panna Still 750ml",
            description: "Smooth, naturally filtered premium bottled water from Tuscany.",
            price: 10000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792616917/aquapanna.jpg",
          },
          {
            id: "voss-still",
            name: "Voss Still 375ml",
            description:
              "Premium Norwegian still water with exceptional purity.",
            price: 7000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792618386/voss-new.jpg",
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
            id: "perrier",
            name: "Perrier Sparkling",
            description:
              "Naturally sparkling mineral water from France.",
            price: 10000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792618385/spark-new.jpg",
          },
          {
            id: "spiced-buttermilk",
            name: "Spiced Butter Milk",
            description:
              "Refreshing South Indian spiced buttermilk blended with herbs.",
            price: 8000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792602144/spiced-butter.jpg",
            chefNote:
              "Poured free at roadside neer mor stalls through Tamil summers, and just the thing to cool down anything spicy",
          },
          {
            id: "lemonade-mint",
            name: "Lemon – Mint",
            description:
              "Crushed Ice with cooling mint and vibrant citrus.",
            price: 10000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792616295/Lemonade-mint-new.jpg",
            chefNote:
              "Squeezed by hand and blended to a frosty slush, made for a hot Lagos afternoon.",
          },
          {
            id: "lemongrass-iced-tea",
            name: "Cold Brew Lemongrass Iced Tea",
            description:
              "Premium tea with fresh lemongrass slowly brewed for 24hrs.",
            price: 10000,
            tags: ["veggie"],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598905/lemongrass.jpg",
            chefNote: "Cold-brewed and unsweetened, so the bright, citrusy lemongrass and the warm bite of ginger come through first; sweeten it your way.",
          },
          {
            id: "iced-filter-coffee",
            name: "Signature Iced Filter Coffee",
            description:
              "Rich South Indian filter coffee, slow dripped and served over ice.",
            price: 12000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598904/spiced-butter-milk.jpg",
            chefNote:
              "Our ice cream is made from the very same kappi, so every sip stays coffee all the way down.",
          },
        ],
      },
      {
        id: "hot-iced",
        name: "Hot",
        items: [
          {
            id: "house-filter-coffee",
            name: "House Filter Coffee",
            description:
              "Traditionally filter-brewed South Indian coffee, rich aroma and a bold finish.",
            price: 10000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792602142/house-filter.jpg",
            chefNote:
              "Served in a dabara and tumbler, so pour it back and forth to cool it and raise the froth, the way Chennai starts its day.",
          },
          {
            id: "zafarani-tea",
            name: "Zafarani Tea",
            description: "Premium black tea, saffron and aromatic spices.",
            price: 12000,
            tags: [],
            image: "https://res.cloudinary.com/dodmtgsij/image/upload/v1792598904/zafarani.jpg",
            chefNote: "The saffron rests in the milk overnight, turning it soft gold before it ever meets the tea.",
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
              "Brewed strong and milky like the tea kadais on Chennai’s street corners; just ask if you take sugar.",
          },
          
        ],
      },
    ],
  },
];