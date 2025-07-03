const { Product } = require('../models');

const sampleProducts = [
  {
    name: 'Apple iPhone 15 Pro',
    description: 'The latest iPhone with titanium design, A17 Pro chip, and advanced camera system.',
    price: 999.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Apple',
      color: 'Natural Titanium',
      storage: '128GB',
      screen: '6.1 inch',
      camera: '48MP',
      battery: '3274mAh'
    }
  },
  {
    name: 'Nike Air Jordan 1 High',
    description: 'Classic basketball sneakers with premium leather construction and iconic design.',
    price: 170.00,
    category: 'Footwear',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Nike',
      color: 'Black/Red/White',
      material: 'Leather',
      type: 'High Top',
      sport: 'Basketball'
    }
  },
  {
    name: 'MacBook Pro 14-inch',
    description: 'Professional laptop with M3 chip, stunning Liquid Retina XDR display, and all-day battery life.',
    price: 1999.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Apple',
      processor: 'M3',
      memory: '16GB',
      storage: '512GB SSD',
      display: '14.2-inch Liquid Retina XDR',
      color: 'Space Gray'
    }
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'The original blue jean since 1873. Classic straight fit with authentic details.',
    price: 89.99,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Levi\'s',
      fit: 'Straight',
      material: '100% Cotton',
      color: 'Medium Wash Blue',
      style: 'Classic'
    }
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Premium noise-canceling wireless headphones with exceptional sound quality.',
    price: 399.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Sony',
      type: 'Over-ear',
      wireless: true,
      noiseCanceling: true,
      batteryLife: '30 hours',
      color: 'Black'
    }
  },
  {
    name: 'Stanley Adventure Quencher Tumbler',
    description: 'Insulated stainless steel tumbler that keeps drinks cold for 11+ hours and hot for 7+ hours.',
    price: 44.95,
    category: 'Home & Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Stanley',
      capacity: '40oz',
      material: 'Stainless Steel',
      insulation: 'Double Wall',
      color: 'Charcoal',
      features: ['Leak Proof', 'Dishwasher Safe']
    }
  },
  {
    name: 'Adidas Ultraboost 23 Running Shoes',
    description: 'High-performance running shoes with responsive Boost midsole and Primeknit upper.',
    price: 189.99,
    category: 'Footwear',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Adidas',
      type: 'Running',
      material: 'Primeknit',
      color: 'Triple Black',
      technology: 'Boost',
      sport: 'Running'
    }
  },
  {
    name: 'Nintendo Switch OLED Console',
    description: 'Gaming console with vibrant 7-inch OLED screen, enhanced audio, and wide adjustable stand.',
    price: 349.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Nintendo',
      display: '7-inch OLED',
      storage: '64GB',
      color: 'White',
      type: 'Handheld Console',
      batteryLife: '4.5-9 hours'
    }
  },
  {
    name: 'Yeti Rambler 20oz Tumbler',
    description: 'Double-wall vacuum insulated tumbler made with kitchen-grade stainless steel.',
    price: 34.99,
    category: 'Home & Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Yeti',
      capacity: '20oz',
      material: 'Stainless Steel',
      color: 'Navy',
      features: ['No Sweat Design', 'Dishwasher Safe'],
      insulation: 'Double Wall'
    }
  },
  {
    name: 'North Face Venture 2 Jacket',
    description: 'Waterproof, breathable rain jacket perfect for hiking and outdoor adventures.',
    price: 99.99,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'The North Face',
      material: 'DryVent',
      waterproof: true,
      color: 'Black',
      type: 'Rain Jacket',
      features: ['Packable', 'Adjustable Hood']
    }
  },
  {
    name: 'Apple AirPods Pro (2nd Gen)',
    description: 'Wireless earbuds with active noise cancellation, transparency mode, and spatial audio.',
    price: 249.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c5fd29?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Apple',
      type: 'True Wireless',
      noiseCanceling: true,
      batteryLife: '6 hours',
      color: 'White',
      features: ['Spatial Audio', 'MagSafe Charging']
    }
  },
  {
    name: 'Patagonia Houdini Windbreaker',
    description: 'Ultra-lightweight windproof jacket that packs into its own pocket.',
    price: 119.99,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Patagonia',
      material: 'Recycled Nylon',
      weight: '3.1oz',
      color: 'Forge Grey',
      features: ['Packable', 'DWR Finish'],
      type: 'Windbreaker'
    }
  },
  {
    name: 'Converse Chuck Taylor All Star',
    description: 'Classic canvas sneakers with rubber toe cap and iconic star logo.',
    price: 64.99,
    category: 'Footwear',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Converse',
      material: 'Canvas',
      color: 'Classic White',
      type: 'Low Top',
      style: 'Casual',
      closure: 'Lace-up'
    }
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Premium Android smartphone with S Pen, 200MP camera, and AI-powered features.',
    price: 1299.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Samsung',
      storage: '256GB',
      camera: '200MP',
      display: '6.8-inch Dynamic AMOLED',
      color: 'Titanium Gray',
      features: ['S Pen', 'AI Camera']
    }
  },
  {
    name: 'Hydro Flask Standard Mouth 21oz',
    description: 'Insulated water bottle that keeps liquids cold for 24 hours or hot for 12 hours.',
    price: 39.95,
    category: 'Home & Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Hydro Flask',
      capacity: '21oz',
      material: 'Stainless Steel',
      color: 'Pacific Blue',
      insulation: 'TempShield',
      features: ['BPA Free', 'Dishwasher Safe']
    }
  },
  {
    name: 'Vans Old Skool Sneakers',
    description: 'Classic skate shoes with signature side stripe and waffle rubber outsole.',
    price: 74.99,
    category: 'Footwear',
    imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Vans',
      material: 'Canvas/Suede',
      color: 'Black/White',
      type: 'Skate Shoe',
      sole: 'Waffle Rubber',
      style: 'Classic'
    }
  },
  {
    name: 'Dell XPS 13 Laptop',
    description: 'Ultra-portable laptop with Intel Core i7, stunning InfinityEdge display, and premium build.',
    price: 1299.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Dell',
      processor: 'Intel Core i7',
      memory: '16GB',
      storage: '512GB SSD',
      display: '13.4-inch FHD+',
      color: 'Platinum Silver'
    }
  },
  {
    name: 'Champion Reverse Weave Hoodie',
    description: 'Classic heavyweight hoodie with reverse weave construction and iconic logo.',
    price: 79.99,
    category: 'Clothing',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Champion',
      material: '82% Cotton, 18% Polyester',
      color: 'Oxford Grey',
      fit: 'Regular',
      features: ['Reverse Weave', 'Kangaroo Pocket'],
      type: 'Pullover Hoodie'
    }
  },
  {
    name: 'Allbirds Tree Runners',
    description: 'Sustainable running shoes made from eucalyptus tree fiber with merino wool lining.',
    price: 98.99,
    category: 'Footwear',
    imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Allbirds',
      material: 'Eucalyptus Tree Fiber',
      color: 'Natural White',
      type: 'Running',
      features: ['Sustainable', 'Machine Washable'],
      lining: 'Merino Wool'
    }
  },
  {
    name: 'Beats Studio3 Wireless Headphones',
    description: 'Over-ear headphones with Pure Adaptive Noise Canceling and Apple W1 chip.',
    price: 349.99,
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Beats',
      type: 'Over-ear',
      wireless: true,
      noiseCanceling: true,
      batteryLife: '22 hours',
      color: 'Matte Black',
      chip: 'Apple W1'
    }
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: 'Multi-functional electric pressure cooker that replaces 7 kitchen appliances.',
    price: 99.99,
    category: 'Home & Kitchen',
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    attributes: {
      brand: 'Instant Pot',
      capacity: '6 Quart',
      functions: ['Pressure Cook', 'Slow Cook', 'Rice Cooker', 'Steamer', 'Sauté', 'Yogurt Maker', 'Warmer'],
      material: 'Stainless Steel',
      color: 'Silver'
    }
  }
];

const seedProducts = async () => {
  try {
    // Delete existing products and recreate with new data
    const existingProducts = await Product.count();
    
    if (existingProducts > 0) {
      console.log('🗑️ Deleting existing products to update with new inventory...');
      await Product.destroy({ where: {}, truncate: true });
    }

    // Create sample products
    await Product.bulkCreate(sampleProducts);
    console.log('🌱 Sample products seeded successfully!');
    console.log(`📊 Created ${sampleProducts.length} products`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
};

module.exports = {
  seedProducts,
  sampleProducts,
}; 