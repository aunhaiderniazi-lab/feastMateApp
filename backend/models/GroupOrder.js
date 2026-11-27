const mongoose = require('mongoose');

const GroupOrderSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Active', 'Placed', 'Cancelled'], default: 'Active' },
    members: [
        {
            name: { type: String, required: true },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
        }
    ],
    cartItems: [
        {
            addedBy: { type: String, required: true },
            foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            qty: { type: Number, default: 1 }
        }
    ],
    createdAt: { type: Date, default: Date.now, expires: 86400 }
});

module.exports = mongoose.model('GroupOrder', GroupOrderSchema);
