const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Food = require('./models/Food');
const User = require('./models/User');

dotenv.config();

const sampleFoods = [
    {
        name: 'Zinger Crunch Burger',
        description: 'Crispy fried chicken fillet with spicy mayo, iceberg lettuce, and melted cheddar.',
        price: 650,
        category: 'Burger',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'
    },
    {
        name: 'Double Smash Beef Burger',
        description: 'Two flame-grilled beef patties with caramelized onions and house signature sauce.',
        price: 890,
        category: 'Burger',
        image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80'
    },
    {
        name: 'Fajita Supreme Pizza',
        description: 'Loaded with spicy marinated chicken, bell peppers, olives, onions, and mozzarella.',
        price: 1450,
        category: 'Pizza',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'
    },
    {
        name: 'Pepperoni Feast Pizza',
        description: 'Classic stone-baked crust topped with beef pepperoni and extra mozzarella cheese.',
        price: 1550,
        category: 'Pizza',
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80'
    },
    {
        name: 'Loaded Masala Fries',
        description: 'Golden crispy fries tossed in peri-peri seasoning and drizzled with cheese sauce.',
        price: 380,
        category: 'Sides',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80'
    },
    {
        name: 'Mint Margarita',
        description: 'Refreshing chilled blend of fresh mint leaves, lime juice, and sparkling soda.',
        price: 250,
        category: 'Drinks',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80'
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');
        const existingFoods = await Food.countDocuments();
        if (existingFoods === 0) {
            await Food.insertMany(sampleFoods);
            console.log('Seeded 6 sample menu items!');
        } else {
            console.log(`Menu already has ${existingFoods} items; skipping food seed.`);
        }
        const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@feastmate.com';
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
            const adminPassword = process.env.SEED_ADMIN_PASSWORD;
            if (!adminPassword) {
                throw new Error('Set SEED_ADMIN_PASSWORD before seeding a new admin account.');
            }
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await User.create({
                name: 'FeastMate Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Created admin user: ' + adminEmail + ' (password from SEED_ADMIN_PASSWORD)');
        }
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seedDatabase();
