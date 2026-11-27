const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true, enum: ['Burger', 'Pizza', 'Sides', 'Drinks'] }
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema);
