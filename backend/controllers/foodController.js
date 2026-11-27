const Food = require('../models/Food');

const getFoods = async (req, res) => {
    try {
        const foods = await Food.find({}).sort({ createdAt: -1 });
        res.status(200).json(foods);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const addFoodItem = async (req, res) => {
    try {
        const { name, price, description, image, category } = req.body;
        if (!name || price === undefined || price === '' || !category) {
            return res.status(400).json({ message: 'Name, Price, and Category are required!' });
        }
        const numericPrice = Number(price);
        if (Number.isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ message: 'Price must be a valid positive number!' });
        }
        const newFood = new Food({
            name: name.trim(),
            price: numericPrice,
            description: (description && description.trim()) || `Freshly prepared ${name.trim()}`,
            image: (image && image.trim()) || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
            category
        });
        await newFood.save();
        res.status(201).json({ message: 'Food item added successfully!', food: newFood });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const deleteFoodItem = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedFood = await Food.findByIdAndDelete(id);
        if (!deletedFood) {
            return res.status(404).json({ message: 'Food item not found!' });
        }
        res.status(200).json({ message: 'Food item deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { getFoods, addFoodItem, deleteFoodItem };
