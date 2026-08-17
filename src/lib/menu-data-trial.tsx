export type DietTag = 'veggie' | 'vegan' | 'nuts' | 'sesame';

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
    id: 'food',
    label: 'Food',
    categories: [
      {
        id: 'comfort-meets-tradition',
        name: 'Comfort Meets Tradition',
        description:
          '"Almost left out of our menu, this beloved dish never quite fit into our dosa or uthappam collection. But perhapsthat\'s exactly what makes it so special. Prepared the traditional way our ancestors would have approved of, it is soft, wholesome, nourishing, andwonderfully delicate—a timeless classic that deserves a place of its own" ',
        image:
          'https://res.cloudinary.com/ansp9yim/image/upload/v1786913007/menu-bg-2.jpg',
        items: [
          {
            id: 'chatti-idli',
            name: 'Chatti Idli',
            description:
              'Soft steamed idlis served in a traditional clay pot with house podi, tempered mustard, curry leaves and warm ghee.',
            price: 15000,
            tags: ['veggie'],
            image:
              'https://res.cloudinary.com/ansp9yim/image/upload/v1786983887/bottom-view-chicken-nuggets-lettuce-fork-plate-salt-black-pepper-wooden-spoons-dark-table_2.jpg',
            chefNote:
              "Steamed low and slow in the clay pot itself — it's what keeps the crumb this soft.",
          },
        ],
      },
      {
        id: 'dosa-collective',
        name: 'The Dosa Collective',
        description:
          'Dosa is a crisp savoury crepe from South India, made from naturally fermented rice and black lentils. A beloved staple enjoyed for breakfast, dinner or as street-side comfort food, now celebrated around the world.',
        image:
          'https://res.cloudinary.com/ansp9yim/image/upload/v1786954926/masala-dosa-is-south-indian-meal-served-with-sambhar-coconut-chutney-selective-focus_1.jpg_2.jpg',
        items: [
          {
            id: 'dosa-classic',
            name: 'Classic',
            description:
              'Cultured cow ghee, naturally fermented rice and lentils, served with fresh chutneys and traditional sambar.',
            price: 15000,
            tags: ['veggie'],
            image:
              'https://res.cloudinary.com/ansp9yim/image/upload/v1787002833/delicious-indian-dosa-composition.jpg',
            chefNote:
              'Our batter ferments for 18 hours — the tang you taste is time, not shortcuts.',
          },
          {
            id: 'dosa-signature',
            name: 'Signature',
            description:
              "Smashed potatoes, masala, roasted spices and curry leaf on the chef's own fermented batter.",
            price: 15000,
            tags: ['veggie'],
            image:
              'https://res.cloudinary.com/ansp9yim/image/upload/v1787002842/29492.jpg',
            chefNote:
              "The potato masala recipe hasn't changed since our very first pop-up.",
          },
          {
            id: 'dosa-ammas',
            name: "Amma's",
            description:
              'Cold-pressed sesame and house podi, inspired by traditional home-style South Indian cooking.',
            price: 15000,
            tags: ['veggie', 'nuts', 'sesame', 'vegan'],
            image: '/menu-items/dosa-ammas.jpg',
            chefNote:
              "Named for the way it's made at home — no restaurant polish, just the real thing.",
          },
          {
            id: 'dosa-special',
            name: 'Special',
            description:
              'Roasted onions, house podi and Uttukuli cow ghee, with fresh vegetables and aromatic spices.',
            price: 15000,
            tags: ['veggie'],
            image: '/menu-items/dosa-special.jpg',
            chefNote:
              'The onions go in while they still have a little bite — texture matters here.',
          },
          {
            id: 'dosa-street',
            name: 'Street',
            description:
              'Mushrooms, cracked pepper and butter, packed with spiced vegetables and fresh herbs.',
            price: 15000,
            tags: ['veggie'],
            image: '/menu-items/dosa-street.jpg',
            chefNote:
              'Inspired by the late-night carts of Chennai — built for heat and speed.',
          },
          {
            id: 'dosa-cheese',
            name: 'Cheese',
            description:
              'Fresh paneer, cheese and mild spices, filled with melted mozzarella.',
            price: 15000,
            tags: ['veggie'],
            image: '/menu-items/dosa-cheese.jpg',
            chefNote:
              'Our most-requested dish by kids — and more than a few adults.',
          },
        ],
      },
      {
        id: 'uthappam-collective',
        name: 'The Uthappam Collective',
        description:
          '"A thicker, soft-centered version of Dosa, slow-cooked with fresh toppings."',
        image:
          'https://res.cloudinary.com/ansp9yim/image/upload/v1786913007/menu-bg-3.jpg',
        items: [
          {
            id: 'uthappam-onion-podi',
            name: 'Onion Podi',
            description:
              'Onions, house podi and cold-pressed sesame oil on a soft South Indian uthappam.',
            price: 16000,
            tags: ['vegan', 'nuts'],
            image: '/menu-items/uthappam-onion-podi.jpg',
            chefNote:
              'The podi is roasted fresh each morning — it loses its punch after a day.',
          },
          {
            id: 'uthappam-beetroot',
            name: 'Beetroot',
            description:
              'Beetroot, coriander, green chili and curry leaves, freshly grated with onions and herbs.',
            price: 16000,
            tags: ['vegan'],
            image: '/menu-items/uthappam-beetroot.jpg',
            chefNote:
              'The colour is all beetroot — nothing added, nothing dyed.',
          },
          {
            id: 'uthappam-garden',
            name: 'Garden',
            description:
              'Crisp onions, tomatoes, carrots, coriander and green chillies for a wholesome South Indian meal.',
            price: 16000,
            tags: ['veggie'],
            image: '/menu-items/uthappam-garden.jpg',
            chefNote:
              "Whatever's freshest at the market that week ends up here.",
          },
        ],
      },
      {
        id: 'desserts',
        name: 'Desserts',
        image:
          'https://res.cloudinary.com/ansp9yim/image/upload/v1786913006/menu-bg-4.jpg',
        items: [
          {
            id: 'payasam',
            name: 'Payasam',
            description:
              'Moong, coconut milk, jaggery and crisp coconut shavings in a rich, creamy pudding.',
            price: 12000,
            tags: ['vegan', 'nuts'],
            image: '/menu-items/payasam.jpg',
            chefNote:
              'Served at every festival in our family — this is the recipe we grew up on.',
          },
          {
            id: 'kesari',
            name: 'Kesari',
            description:
              'Saffron, ghee and cardamom in a rich South Indian semolina dessert.',
            price: 12000,
            tags: ['veggie', 'nuts'],
            image: '/menu-items/kesari.jpg',
            chefNote:
              "A generous pinch of real saffron — you'll see it, not just taste it.",
          },
        ],
      },
    ],
  },
  {
    id: 'drinks',
    label: 'Drinks',
    categories: [
      {
        id: 'the-bar',
        name: 'The Bar',
        image: '',
        items: [
          {
            id: 'house-still',
            name: 'House Still',
            description: 'Pure, crisp still water served chilled.',
            price: 3600,
            tags: [],
            image: '/menu-items/house-still.jpg',
          },
          {
            id: 'house-sparkling',
            name: 'House Sparkling',
            description: 'Light sparkling water with a refreshing finish.',
            price: 8000,
            tags: [],
            image: '/menu-items/house-sparkling.jpg',
          },
          {
            id: 'aqua-panna',
            name: 'Aqua Panna Still Water',
            description: 'Smooth, naturally filtered premium bottled water.',
            price: 4000,
            tags: [],
            image: '/menu-items/aqua-panna.jpg',
          },
          {
            id: 'voss-still',
            name: 'Voss Still',
            description:
              'Premium Norwegian still water with exceptional purity.',
            price: 6000,
            tags: [],
            image: '/menu-items/voss-still.jpg',
          },
          {
            id: 'perrier',
            name: 'Sparkling Perrier',
            description:
              'Naturally sparkling mineral water with a crisp finish.',
            price: 9000,
            tags: [],
            image: '/menu-items/perrier.jpg',
          },
          {
            id: 'lemonade-mint',
            name: 'Lemonade – Mint',
            description:
              'Fresh lemonade with cooling mint and vibrant citrus flavour.',
            price: 10000,
            tags: [],
            image: '/menu-items/lemonade-mint.jpg',
            chefNote:
              'Muddled to order — the mint should still smell green when it hits the glass.',
          },
        ],
      },
      {
        id: 'hot-iced',
        name: 'Hot & Iced',
        items: [
          {
            id: 'spiced-buttermilk',
            name: 'Spiced Butter Milk',
            description:
              'Refreshing South Indian spiced buttermilk blended with herbs.',
            price: 10000,
            tags: [],
            image: '/menu-items/spiced-buttermilk.jpg',
            chefNote:
              'Curry leaf and ginger go in last, so they stay fragrant, not boiled out.',
          },
          {
            id: 'iced-filter-coffee',
            name: 'Signature Iced Filter Coffee',
            description:
              'Rich South Indian filter coffee, slow brewed and served over ice.',
            price: 12000,
            tags: [],
            image: '/menu-items/iced-filter-coffee.jpg',
            chefNote:
              'Brewed hot through a traditional filter first, then cooled — never brewed over ice.',
          },
          {
            id: 'lemongrass-iced-tea',
            name: 'Cold Brew Lemongrass Iced Tea',
            description:
              'Premium tea with fresh lemongrass and natural citrus notes.',
            price: 10000,
            tags: ['veggie'],
            image: '/menu-items/lemongrass-iced-tea.jpg',
            chefNote: 'Cold-brewed overnight for a smoother, less bitter cup.',
          },
          {
            id: 'zafarani-tea',
            name: 'Zafarani Tea',
            description: 'Premium black tea, saffron and aromatic spices.',
            price: 12000,
            tags: [],
            image: '/menu-items/zafarani-tea.jpg',
            chefNote: 'Steeped with whole saffron threads, not extract.',
          },
          {
            id: 'masala-chai',
            name: 'Masala Chai',
            description:
              'Premium black tea, fresh milk, cardamom, cinnamon, ginger and cloves.',
            price: 12000,
            tags: [],
            image: '/menu-items/masala-chai.jpg',
            chefNote:
              "Our spice blend is ground fresh weekly — it's the first thing regulars notice.",
          },
          {
            id: 'house-filter-coffee',
            name: 'House Filter Coffee',
            description:
              'Traditionally filter-brewed South Indian coffee, rich aroma and a bold finish.',
            price: 10000,
            tags: [],
            image: '/menu-items/house-filter-coffee.jpg',
            chefNote:
              'Served the traditional way — in a davara and tumbler, poured tableside.',
          },
        ],
      },
    ],
  },
];
