import connectDB from './mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';

const sampleCategories = [
  {
    name: 'Electronics',
    description: 'Latest electronic gadgets, smartphones, laptops, and accessories for modern living.',
    no_of_items: 25
  },
  {
    name: 'Fashion & Clothing',
    description: 'Trendy clothing, footwear, and fashion accessories for men, women, and children.',
    no_of_items: 30
  },
  {
    name: 'Home & Kitchen',
    description: 'Essential home appliances, kitchen tools, and household items for comfortable living.',
    no_of_items: 20
  },
  {
    name: 'Health & Beauty',
    description: 'Personal care products, cosmetics, and health supplements for wellness.',
    no_of_items: 15
  },
  {
    name: 'Sports & Fitness',
    description: 'Sports equipment, fitness gear, and outdoor activity essentials.',
    no_of_items: 12
  }
];

const sampleProducts = [
  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'Premium quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 2999,
    available_on: ['Amazon', 'Flipkart', 'Myntra'],
    links: [
      { platform: 'Amazon', url: 'https://amazon.in/product1' },
      { platform: 'Flipkart', url: 'https://flipkart.com/product1' }
    ],
    category: 'Electronics'
  },
  {
    name: 'Smartphone 128GB',
    description: 'Latest smartphone with 128GB storage, dual camera, and fast charging technology.',
    price: 15999,
    available_on: ['Amazon', 'Flipkart', 'Meesho'],
    links: [
      { platform: 'Amazon', url: 'https://amazon.in/product2' },
      { platform: 'Flipkart', url: 'https://flipkart.com/product2' }
    ],
    category: 'Electronics'
  },
  
  // Fashion
  {
    name: 'Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt available in multiple colors and sizes.',
    price: 599,
    available_on: ['Myntra', 'Amazon', 'Meesho'],
    links: [
      { platform: 'Myntra', url: 'https://myntra.com/product3' },
      { platform: 'Amazon', url: 'https://amazon.in/product3' }
    ],
    category: 'Fashion & Clothing'
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight running shoes with advanced cushioning and breathable material.',
    price: 2499,
    available_on: ['Amazon', 'Flipkart', 'Myntra'],
    links: [
      { platform: 'Amazon', url: 'https://amazon.in/product4' },
      { platform: 'Myntra', url: 'https://myntra.com/product4' }
    ],
    category: 'Fashion & Clothing'
  },
  
  // Home & Kitchen
  {
    name: 'Non-Stick Cookware Set',
    description: 'Complete 5-piece non-stick cookware set perfect for modern kitchens.',
    price: 3999,
    available_on: ['Amazon', 'Flipkart'],
    links: [
      { platform: 'Amazon', url: 'https://amazon.in/product5' },
      { platform: 'Flipkart', url: 'https://flipkart.com/product5' }
    ],
    category: 'Home & Kitchen'
  },
  {
    name: 'Electric Kettle',
    description: 'Fast boiling electric kettle with auto shut-off and temperature control.',
    price: 1299,
    available_on: ['Amazon', 'Flipkart', 'Meesho'],
    links: [
      { platform: 'Amazon', url: 'https://amazon.in/product6' }
    ],
    category: 'Home & Kitchen'
  },
  
  // Health & Beauty
  {
    name: 'Face Moisturizer',
    description: 'Daily moisturizer with SPF protection and natural ingredients for all skin types.',
    price: 899,
    available_on: ['Amazon', 'Myntra', 'Meesho'],
    links: [
      { platform: 'Amazon', url: 'https://amazon.in/product7' },
      { platform: 'Myntra', url: 'https://myntra.com/product7' }
    ],
    category: 'Health & Beauty'
  },
  
  // Sports & Fitness
  {
    name: 'Yoga Mat',
    description: 'Premium quality yoga mat with anti-slip surface and carrying strap.',
    price: 1199,
    available_on: ['Amazon', 'Flipkart'],
    links: [
      { platform: 'Amazon', url: 'https://amazon.in/product8' },
      { platform: 'Flipkart', url: 'https://flipkart.com/product8' }
    ],
    category: 'Sports & Fitness'
  }
];

export async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    
    console.log('Cleared existing data...');
    
    // Insert categories
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log(`Created ${createdCategories.length} categories`);
    
    // Create a map of category names to IDs
    const categoryMap = new Map();
    createdCategories.forEach(cat => {
      categoryMap.set(cat.name, cat._id);
    });
    
    // Insert products with correct category references
    const productsWithCategoryIds = sampleProducts.map(product => ({
      ...product,
      category: categoryMap.get(product.category)
    }));
    
    const createdProducts = await Product.insertMany(productsWithCategoryIds);
    console.log(`Created ${createdProducts.length} products`);
    
    console.log('Database seeded successfully!');
    return { success: true, message: 'Database seeded successfully!' };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error: 'Failed to seed database' };
  }
} 