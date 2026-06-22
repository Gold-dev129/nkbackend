require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Banner = require('./models/Banner');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://alterraszn_db_user:XZSgp6TxYBJF078i@cluster0.k1vt3wu.mongodb.net/nkyluxury?retryWrites=true&w=majority&appName=Cluster0';

const categoriesData = [
  { name: 'Necklaces', slug: 'necklaces', description: 'Exquisite necklaces and pendants' },
  { name: 'Rings', slug: 'rings', description: 'Timeless engagement and fine jewelry rings' },
  { name: 'Bracelets', slug: 'bracelets', description: 'Luxury tennis and solid gold bracelets' },
  { name: 'Watches', slug: 'watches', description: 'Premium luxury watches and horology curation' }
];

const bannersData = [
  {
    title: 'MINIMAL DESIGN, MAXIMAL STATEMENT',
    subtitle: 'Explore our curation of luxury diamonds and signature wristwatches.',
    image: '/images/banners/banner1.jpg',
    link: '/shop'
  },
  {
    title: 'GRAND ATELIER WATCHES',
    subtitle: 'Indulge in our selection of high-fashion and bespoke wrist chronographs.',
    image: '/images/banners/banner2.jpg',
    link: '/shop?category=watches'
  }
];

const productsData = [
  {
    name: 'VVS Diamond Solitaire Ring',
    description: 'A brilliant-cut round solitaire VVS diamond set in a solid 18K yellow gold band. A statement of pure luxury and eternal commitment.',
    shortDescription: '18K Yellow Gold VVS Diamond Solitaire Ring',
    price: 1500000,
    discountPrice: 0,
    stock: 5,
    sku: 'NK-RNG-01',
    material: '18K Gold',
    weight: '3.8g',
    featured: true,
    bestSeller: true,
    newArrival: false,
    images: ['/images/products/ring.jpg']
  },
  {
    name: 'Royal Diamond Tennis Bracelet',
    description: 'A continuous line of matching certified round diamonds, individually prong-set in 18K white gold. Classic elegance reimagined.',
    shortDescription: '18K White Gold VVS Diamond Tennis Bracelet',
    price: 2800000,
    discountPrice: 0,
    stock: 3,
    sku: 'NK-BRC-02',
    material: '18K White Gold',
    weight: '12.5g',
    featured: true,
    bestSeller: true,
    newArrival: false,
    images: ['/images/products/bracelet.jpg']
  },
  {
    name: 'Atelier Gold Emerald Necklace',
    description: 'A stunning teardrop certified emerald pendant suspended on a fine 18K yellow gold chain adorned with micro-diamonds.',
    shortDescription: '18K Gold Teardrop Emerald & Diamond Necklace',
    price: 4200000,
    discountPrice: 0,
    stock: 2,
    sku: 'NK-NEC-03',
    material: '18K Gold',
    weight: '8.2g',
    featured: true,
    bestSeller: false,
    newArrival: true,
    images: ['/images/products/necklace.jpg']
  },
  {
    name: 'NK Imperial Chronograph',
    description: 'Bespoke automatic luxury wristwatch featuring a custom diamond-encrusted bezel, black skeletal tourbillon dial, and premium steel wristband.',
    shortDescription: 'Bespoke Diamond Bezel Automatic Chronograph Watch',
    price: 9500000,
    discountPrice: 0,
    stock: 1,
    sku: 'NK-WTC-04',
    material: 'Platinum Gold',
    weight: '145g',
    featured: true,
    bestSeller: true,
    newArrival: false,
    images: ['/images/products/watch.jpg']
  },
  {
    name: 'VVS Diamond Halo Earrings',
    description: 'A pair of classic solitaire certified diamonds surrounded by brilliant micro-diamond halos, crafted in 18K white gold.',
    shortDescription: '18K White Gold Solitaire Diamond Halo Stud Earrings',
    price: 1800000,
    discountPrice: 0,
    stock: 8,
    sku: 'NK-EAR-05',
    material: '18K White Gold',
    weight: '2.5g',
    featured: false,
    bestSeller: false,
    newArrival: true,
    images: ['/images/products/earrings.jpg']
  },
  {
    name: 'Engraved Gold Signature Bangle',
    description: 'A high-polish solid 24K gold bangle decorated with geometric signature engravings. A minimal, bold statement.',
    shortDescription: 'Solid 24K Gold Engraved Signature Bangle',
    price: 1200000,
    discountPrice: 0,
    stock: 4,
    sku: 'NK-BRC-06',
    material: '24K Gold',
    weight: '18.4g',
    featured: false,
    bestSeller: false,
    newArrival: true,
    images: ['/images/products/bangle.jpg']
  }
];

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database.');

    // Seed Categories
    console.log('Seeding Categories...');
    await Category.deleteMany({});
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${createdCategories.length} categories.`);

    // Seed Banners
    console.log('Seeding Banners...');
    await Banner.deleteMany({});
    const createdBanners = await Banner.insertMany(bannersData);
    console.log(`Seeded ${createdBanners.length} banners.`);

    // Seed Products
    console.log('Seeding Products...');
    await Product.deleteMany({});

    // Map categories to products
    const ringCat = createdCategories.find(c => c.slug === 'rings');
    const necklaceCat = createdCategories.find(c => c.slug === 'necklaces');
    const braceletCat = createdCategories.find(c => c.slug === 'bracelets');
    const watchCat = createdCategories.find(c => c.slug === 'watches');

    const finalizedProducts = productsData.map(prod => {
      let categoryId = createdCategories[0]._id;
      if (prod.sku.includes('RNG') && ringCat) categoryId = ringCat._id;
      if (prod.sku.includes('NEC') && necklaceCat) categoryId = necklaceCat._id;
      if (prod.sku.includes('BRC') && braceletCat) categoryId = braceletCat._id;
      if (prod.sku.includes('WTC') && watchCat) categoryId = watchCat._id;
      if (prod.sku.includes('EAR') && ringCat) categoryId = ringCat._id;

      return {
        ...prod,
        category: categoryId
      };
    });

    // Use Product.create to trigger Mongoose pre-save slug hooks
    const createdProducts = await Product.create(finalizedProducts);
    console.log(`Seeded ${createdProducts.length} products.`);

    console.log('Database successfully seeded with local permanent image paths!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
