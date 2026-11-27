const Order = require('../models/Order');
const Food = require('../models/Food');

const placeOrder = async (req, res) => {
    try {
        const { items, address, paymentMethod } = req.body;
        const userId = req.user ? req.user._id : req.body.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Please log in to place an order' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
        if (!address || !address.trim()) {
            return res.status(400).json({ message: 'Delivery address is required' });
        }

        const verifiedItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
            const foodDoc = await Food.findById(item._id || item.food);
            if (!foodDoc) {
                return res.status(404).json({ message: `Food item "${item.name}" is no longer available` });
            }
            const qty = Math.max(1, parseInt(item.qty, 10) || 1);
            verifiedItems.push({
                food: foodDoc._id,
                name: foodDoc.name,
                qty,
                price: foodDoc.price
            });
            calculatedTotal += foodDoc.price * qty;
        }

        const newOrder = await Order.create({
            user: userId,
            items: verifiedItems,
            totalAmount: calculatedTotal,
            address: address.trim(),
            paymentMethod: paymentMethod || 'Cash on Delivery'
        });

        res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user && req.user.role !== 'admin' && req.user._id.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowed = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }
        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({ message: 'Order status updated successfully!', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { placeOrder, getUserOrders, getAllOrders, updateOrderStatus };
