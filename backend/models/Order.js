const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            food: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Food',
                required: true
            },
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    isGroupOrder: { type: Boolean, default: false },
    roomCode: { type: String, default: null },
    address: { type: String, required: true },
    paymentMethod: { type: String, required: true, default: 'Cash on Delivery' },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
