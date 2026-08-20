export type ProductCategory =
    | 'drinkware'
    | 'spice-mixes'
    | 'coffee-chai'
    | 'apparel';

export type Product = {
    id: string;
    slug: string;
    name: string;
    category: ProductCategory;
    price: number; // NGN
    compareAtPrice?: number; // set when the item is on sale
    shortDescription: string;
    description: string;
    details: { label: string; value: string }[];
    tags: string[];
    image: string; // primary product photo
    gallery?: string[]; // additional angles — falls back to [image] if omitted
    inStock: boolean;
    isNew?: boolean;
};

export const categories: { id: ProductCategory; label: string }[] = [
    { id: 'drinkware', label: 'Drinkware' },
    { id: 'spice-mixes', label: 'Spice Mixes' },
    { id: 'coffee-chai', label: 'Coffee & Chai' },
    { id: 'apparel', label: 'Apparel & Goods' },
];

export const products: Product[] = [
    {
        id: 'davara-tumbler-set',
        slug: 'davara-tumbler-set',
        name: 'Davara Tumbler Set',
        category: 'drinkware',
        price: 18000,
        shortDescription:
            'The traditional stainless steel tumbler and davara, sized for a proper filter coffee pour.',
        description:
            "Filter coffee isn't complete without the pour — this davara and tumbler set is shaped the traditional way, for aerating and cooling your brew with every transfer. Solid stainless steel, weighted to feel substantial in hand.",
        details: [
            { label: 'Material', value: 'Stainless steel' },
            { label: 'Set includes', value: '1 tumbler, 1 davara' },
            { label: 'Capacity', value: '150ml' },
            { label: 'Care', value: 'Hand wash recommended' },
        ],
        tags: ['Filter Coffee', 'Traditional'],
        image: '/store/products/davara-tumbler-set.jpg',
        gallery: [
            '/store/products/davara-tumbler-set.jpg',
            '/store/products/davara-tumbler-set-2.jpg',
        ],
        inStock: true,
        isNew: true,
    },
    {
        id: 'banana-leaf-mug',
        slug: 'banana-leaf-mug',
        name: 'Banana Leaf Print Mug',
        category: 'drinkware',
        price: 9500,
        shortDescription:
            'Stoneware mug with a hand-illustrated banana leaf print, glazed in warm clay-pot tones.',
        description:
            "Our banana leaf motif, the one you'll find woven through the restaurant, on a mug built for everyday chai or coffee. Glazed stoneware with a comfortable handle and a generous 350ml capacity.",
        details: [
            { label: 'Material', value: 'Glazed stoneware' },
            { label: 'Capacity', value: '350ml' },
            { label: 'Care', value: 'Dishwasher & microwave safe' },
        ],
        tags: ['Everyday', 'Gift-worthy'],
        image: '/store/products/banana-leaf-mug.jpg',
        inStock: true,
    },
    {
        id: 'brass-rim-chai-glasses',
        slug: 'brass-rim-chai-glasses',
        name: 'Brass-Rim Chai Glass Set',
        category: 'drinkware',
        price: 14000,
        compareAtPrice: 17000,
        shortDescription:
            'Set of two short glass tumblers with a brushed brass rim, for masala chai the way it should be served.',
        description:
            "Small enough for a proper chai measure, sturdy enough for daily use. Each glass is finished with a brushed brass rim that matches the brass fixtures around the restaurant. Sold as a set of two.",
        details: [
            { label: 'Material', value: 'Glass, brushed brass rim' },
            { label: 'Set includes', value: '2 glasses' },
            { label: 'Capacity', value: '90ml each' },
        ],
        tags: ['Chai', 'Set of 2'],
        image: '/store/products/brass-rim-chai-glasses.jpg',
        inStock: true,
    },
    {
        id: 'house-podi',
        slug: 'house-podi',
        name: 'House Podi Spice Mix',
        category: 'spice-mixes',
        price: 6500,
        shortDescription:
            'The dosa-side podi from the restaurant, roasted fresh and ground in small batches.',
        description:
            "This is the exact podi that lands on your table with every dosa order — lentils and dried red chillies, dry-roasted and ground in-house. Stir into ghee or eat it straight off the spoon. No fillers, no preservatives.",
        details: [
            { label: 'Net weight', value: '150g' },
            { label: 'Shelf life', value: '3 months from roast date' },
            { label: 'Contains', value: 'Lentils, dried chillies, sesame' },
        ],
        tags: ['House Recipe', 'Vegan'],
        image: '/store/products/house-podi.jpg',
        inStock: true,
        isNew: true,
    },
    {
        id: 'sambar-masala',
        slug: 'sambar-masala',
        name: 'Sambar Masala Blend',
        category: 'spice-mixes',
        price: 5500,
        shortDescription:
            'A roasted lentil-and-spice blend for restaurant-style sambar at home.',
        description:
            'Coriander, toor dal, dried chillies and curry leaf, roasted and ground the way our kitchen has done it for years. A couple of spoonfuls turns simple dal and vegetables into proper sambar.',
        details: [
            { label: 'Net weight', value: '200g' },
            { label: 'Shelf life', value: '4 months from roast date' },
            { label: 'Contains', value: 'Lentils, coriander, dried chillies' },
        ],
        tags: ['House Recipe', 'Vegan'],
        image: '/store/products/sambar-masala.jpg',
        inStock: true,
    },
    {
        id: 'rasam-powder',
        slug: 'rasam-powder',
        name: 'Rasam Powder',
        category: 'spice-mixes',
        price: 5500,
        shortDescription:
            'Peppery, tamarind-forward rasam powder for the soup that ends every proper meal.',
        description:
            'Black pepper, cumin, coriander and dried tamarind skin, ground fine. Simmer a spoonful with tamarind water and tomato for a rasam that tastes like it simmered all afternoon.',
        details: [
            { label: 'Net weight', value: '150g' },
            { label: 'Shelf life', value: '4 months from roast date' },
            { label: 'Contains', value: 'Pepper, cumin, coriander, tamarind' },
        ],
        tags: ['House Recipe', 'Vegan'],
        image: '/store/products/rasam-powder.jpg',
        inStock: true,
    },
    {
        id: 'filter-coffee-beans',
        slug: 'filter-coffee-beans',
        name: 'House Filter Coffee Beans',
        category: 'coffee-chai',
        price: 8500,
        shortDescription:
            "The same coffee-chicory blend we brew in-house, roasted for the traditional filter.",
        description:
            "An 80:20 coffee-to-chicory blend, roasted specifically for the slow drip of a traditional South Indian filter. Comes coarse-ground and ready to brew — just add the davara and a little patience.",
        details: [
            { label: 'Net weight', value: '250g' },
            { label: 'Blend', value: '80% coffee, 20% chicory' },
            { label: 'Grind', value: 'Coarse, filter-ready' },
        ],
        tags: ['Filter Coffee', 'Best Seller'],
        image: '/store/products/filter-coffee-beans.jpg',
        inStock: true,
    },
    {
        id: 'masala-chai-blend',
        slug: 'masala-chai-blend',
        name: 'Masala Chai Blend',
        category: 'coffee-chai',
        price: 6000,
        shortDescription:
            'Loose black tea pre-blended with cardamom, cinnamon, ginger and clove.',
        description:
            "Our masala chai spice blend, mixed straight into a strong Assam black tea so all you have to do is simmer with milk. Cardamom-forward, with a warm clove-and-ginger finish.",
        details: [
            { label: 'Net weight', value: '150g' },
            { label: 'Base', value: 'Assam black tea' },
            { label: 'Brew', value: 'Simmer 4–5 min with milk' },
        ],
        tags: ['Chai', 'Vegan'],
        image: '/store/products/masala-chai-blend.jpg',
        inStock: true,
    },
    {
        id: 'zafarani-loose-tea',
        slug: 'zafarani-loose-tea',
        name: 'Zafarani Loose Tea',
        category: 'coffee-chai',
        price: 7500,
        compareAtPrice: 9000,
        shortDescription:
            'Black tea steeped with real saffron threads — the loose-leaf version of our Zafarani Tea.',
        description:
            "Whole saffron threads blended into a premium black tea base, the same way we brew it in the restaurant. Steep 3–4 minutes for a golden, fragrant cup.",
        details: [
            { label: 'Net weight', value: '100g' },
            { label: 'Contains', value: 'Black tea, saffron threads' },
            { label: 'Brew', value: 'Steep 3–4 min' },
        ],
        tags: ['Premium', 'Gift-worthy'],
        image: '/store/products/zafarani-loose-tea.jpg',
        inStock: true,
    },
    {
        id: 'canvas-tote',
        slug: 'canvas-tote',
        name: "K's Kitchen Canvas Tote",
        category: 'apparel',
        price: 8000,
        shortDescription:
            'Heavyweight canvas tote with the K\'s Kitchen wordmark, sized for a proper market run.',
        description:
            "12oz canvas, reinforced stitching at the handles, big enough for spice jars and coffee bags alike. The wordmark is screen-printed, not stuck on — it'll outlast the bag.",
        details: [
            { label: 'Material', value: '12oz cotton canvas' },
            { label: 'Dimensions', value: '38cm x 42cm' },
            { label: 'Print', value: 'Screen-printed wordmark' },
        ],
        tags: ['Everyday'],
        image: '/store/products/canvas-tote.jpg',
        inStock: true,
    },
    {
        id: 'linen-apron',
        slug: 'linen-apron',
        name: 'Linen Kitchen Apron',
        category: 'apparel',
        price: 15000,
        shortDescription:
            'Adjustable linen apron in roasted-coffee brown, with a front pocket for a notepad or spoon.',
        description:
            "Midweight linen that softens with every wash. Adjustable neck strap, long ties, and a single front pocket sized for a notepad, phone, or the spoon you keep losing.",
        details: [
            { label: 'Material', value: 'Midweight linen' },
            { label: 'Fit', value: 'Adjustable, one size' },
            { label: 'Care', value: 'Machine wash cold' },
        ],
        tags: ['Kitchen', 'Gift-worthy'],
        image: '/store/products/linen-apron.jpg',
        inStock: true,
        isNew: true,
    },
    {
        id: 'embroidered-cap',
        slug: 'embroidered-cap',
        name: "K's Kitchen Cap",
        category: 'apparel',
        price: 7000,
        shortDescription:
            'Structured cotton cap with an embroidered banana-leaf motif on the front panel.',
        description:
            'A simple structured cap in roasted-coffee brown, with the banana leaf motif embroidered (not printed) on the front panel. Adjustable strap at the back.',
        details: [
            { label: 'Material', value: 'Cotton twill' },
            { label: 'Fit', value: 'Adjustable strap' },
            { label: 'Detail', value: 'Embroidered front panel' },
        ],
        tags: ['Everyday'],
        image: '/store/products/embroidered-cap.jpg',
        inStock: false,
    },
];