/**
 * Seed script — populates MongoDB with sample products and an admin user
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecom_distributed';

const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  googleId: String, avatar: String, role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema({
  name: String, description: String, price: Number, category: String,
  images: [String], stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 }, numReviews: { type: Number, default: 0 },
  seller: mongoose.Schema.Types.ObjectId, createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and Hi-Res Audio support. Perfect for music lovers and remote workers.',
    price: 4999, category: 'Electronics', stock: 50,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
    rating: 4.5, numReviews: 128,
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: 'Tenkeyless mechanical keyboard with Cherry MX Red switches, RGB backlighting, and N-key rollover. Built for competitive gaming.',
    price: 3499, category: 'Electronics', stock: 30,
    images: ['https://images.unsplash.com/photo-1593152167544-085d3b9c4938?w=500'],
    rating: 4.7, numReviews: 89,
  },
  {
    name: 'Running Shoes Pro Elite',
    description: 'Lightweight performance running shoes with responsive foam cushioning, breathable mesh upper, and durable rubber outsole for all-terrain use.',
    price: 2999, category: 'Sports', stock: 80,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    rating: 4.3, numReviews: 214,
  },
  {
    name: 'Minimalist Leather Wallet',
    description: 'Slim RFID-blocking genuine leather wallet. Holds up to 8 cards and cash. Available in black and brown.',
    price: 799, category: 'Fashion', stock: 120,
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=500'],
    rating: 4.6, numReviews: 67,
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall vacuum insulated 750ml bottle. Keeps drinks cold for 24 hours and hot for 12 hours. BPA-free, leak-proof lid.',
    price: 599, category: 'Sports', stock: 200,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    rating: 4.4, numReviews: 342,
  },
  {
    name: 'The Art of Thinking Clearly',
    description: 'Rolf Dobelli\'s bestselling guide to 99 cognitive biases that influence our thinking and decision-making. A must-read for critical thinkers.',
    price: 349, category: 'Books', stock: 75,
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
    rating: 4.2, numReviews: 523,
  },
  {
    name: 'Smart LED Desk Lamp',
    description: 'Touch-controlled LED desk lamp with 5 color modes, 5 brightness levels, USB-A charging port, and eye-care technology. Memory function included.',
    price: 1299, category: 'Home & Kitchen', stock: 45,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
    rating: 4.1, numReviews: 91,
  },
  {
    name: 'Yoga Mat Premium',
    description: 'Eco-friendly 6mm thick non-slip yoga mat with alignment lines. Made from natural tree rubber, includes carrying strap. 183 × 61 cm.',
    price: 1499, category: 'Sports', stock: 60,
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
    rating: 4.8, numReviews: 176,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: 'Waterproof IPX7 360° sound Bluetooth 5.0 speaker. 20W output, 12-hour battery, built-in mic for calls. Floats on water.',
    price: 2499, category: 'Electronics', stock: 35,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'],
    rating: 4.5, numReviews: 203,
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted ceramic mugs with matte finish, 350ml capacity each. Microwave and dishwasher safe. Minimalist Nordic design.',
    price: 999, category: 'Home & Kitchen', stock: 90,
    images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500'],
    rating: 4.6, numReviews: 88,
  },
  {
    name: 'Face Moisturizer SPF 50',
    description: 'Lightweight daily moisturizer with broad spectrum SPF 50 UV protection, hyaluronic acid, and vitamin C. Non-comedogenic, suitable for all skin types.',
    price: 699, category: 'Beauty', stock: 150,
    images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500'],
    rating: 4.3, numReviews: 412,
  },
  {
    name: 'Wooden Chess Set',
    description: 'Classic handcrafted wooden chess set with weighted pieces and folding board. Board size 40×40cm. Perfect for beginners and enthusiasts.',
    price: 1799, category: 'Toys', stock: 25,
    images: ['https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=500'],
    rating: 4.9, numReviews: 54,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create admin user
    const adminPass = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@shopflow.com',
      password: adminPass,
      role: 'admin',
    });
    console.log(`✓ Admin created: admin@shopflow.com / admin123`);

    // Create test user
    const userPass = await bcrypt.hash('user123', 12);
    await User.create({
      name: 'Test User',
      email: 'user@shopflow.com',
      password: userPass,
      role: 'user',
    });
    console.log(`✓ Test user created: user@shopflow.com / user123`);

    // Create products
    const products = await Product.insertMany(
      sampleProducts.map((p) => ({ ...p, seller: admin._id }))
    );
    console.log(`✓ Created ${products.length} sample products`);

    console.log('\n🚀 Seed complete! You can now start the server.\n');
    console.log('  Admin login : admin@shopflow.com / admin123');
    console.log('  User login  : user@shopflow.com  / user123\n');
  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
