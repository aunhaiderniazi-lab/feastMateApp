const GroupOrder = require('../models/GroupOrder');
const Order = require('../models/Order');
const Food = require('../models/Food');

const createRoom = async (req, res) => {
    try {
        const hostId = req.user ? req.user._id : req.body.hostId;
        const hostName = (req.user ? req.user.name : req.body.hostName)?.trim();
        if (!hostId || !hostName) {
            return res.status(400).json({ message: 'Host ID and Host Name are required!' });
        }

        let roomCode = '';
        for (let attempt = 0; attempt < 5; attempt++) {
            const candidate = 'FEAST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            const existing = await GroupOrder.findOne({ roomCode: candidate });
            if (!existing) {
                roomCode = candidate;
                break;
            }
        }
        if (!roomCode) {
            return res.status(500).json({ message: 'Could not generate a unique room code, please retry' });
        }

        const newRoom = new GroupOrder({
            roomCode,
            hostId,
            members: [{ name: hostName, userId: hostId }]
        });
        await newRoom.save();
        res.status(201).json({ message: 'Group Order Room Created!', room: newRoom });
    } catch (error) {
        console.error('Backend Create Room Error:', error);
        res.status(500).json({ message: 'Server Error creating room', error: error.message });
    }
};

const joinRoom = async (req, res) => {
    try {
        const { roomCode, memberName, userId } = req.body;
        if (!roomCode || !memberName) {
            return res.status(400).json({ message: 'Room code and your name are required!' });
        }
        const room = await GroupOrder.findOne({ roomCode: roomCode.toUpperCase().trim(), status: 'Active' });
        if (!room) {
            return res.status(404).json({ message: 'Active Room not found or expired!' });
        }
        const cleanName = memberName.trim();
        const exists = room.members.find(m => m.name.toLowerCase() === cleanName.toLowerCase());
        if (!exists) {
            room.members.push({ name: cleanName, userId: userId || null });
            await room.save();
        }
        res.status(200).json({ message: 'Joined Room Successfully!', room });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const addItemToGroupCart = async (req, res) => {
    try {
        const { roomCode, addedBy, foodId, qty = 1 } = req.body;
        const room = await GroupOrder.findOne({ roomCode: roomCode?.toUpperCase().trim(), status: 'Active' });
        if (!room) return res.status(404).json({ message: 'Active room not found!' });

        const foodDoc = await Food.findById(foodId);
        if (!foodDoc) return res.status(404).json({ message: 'Food item not found!' });

        const parsedQty = Math.max(1, parseInt(qty, 10) || 1);
        const existingItem = room.cartItems.find(
            item => item.foodId.toString() === foodId.toString() && item.addedBy === addedBy
        );

        if (existingItem) {
            existingItem.qty += parsedQty;
        } else {
            room.cartItems.push({
                addedBy,
                foodId: foodDoc._id,
                name: foodDoc.name,
                price: foodDoc.price,
                qty: parsedQty
            });
        }

        await room.save();
        res.status(200).json({ message: 'Item added to group cart!', room });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const removeItemFromGroupCart = async (req, res) => {
    try {
        const { roomCode, itemIndex } = req.body;
        const room = await GroupOrder.findOne({ roomCode: roomCode?.toUpperCase().trim(), status: 'Active' });
        if (!room) return res.status(404).json({ message: 'Active room not found!' });

        if (itemIndex < 0 || itemIndex >= room.cartItems.length) {
            return res.status(400).json({ message: 'Invalid item index' });
        }

        if (room.cartItems[itemIndex].qty > 1) {
            room.cartItems[itemIndex].qty -= 1;
        } else {
            room.cartItems.splice(itemIndex, 1);
        }

        await room.save();
        res.status(200).json({ message: 'Group cart updated!', room });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getRoomDetails = async (req, res) => {
    try {
        const { roomCode } = req.params;
        const room = await GroupOrder.findOne({ roomCode: roomCode.toUpperCase().trim() });
        if (!room) return res.status(404).json({ message: 'Room not found!' });
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const checkoutGroupOrder = async (req, res) => {
    try {
        const { roomCode, address, paymentMethod, userId } = req.body;
        const room = await GroupOrder.findOne({ roomCode: roomCode?.toUpperCase().trim(), status: 'Active' });
        if (!room) return res.status(404).json({ message: 'Active room not found!' });
        if (room.cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty!' });
        if (!address || !address.trim()) return res.status(400).json({ message: 'Delivery address is required!' });

        const totalAmount = room.cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const finalUserId = (req.user && req.user._id) || userId || room.hostId;

        const newOrder = new Order({
            user: finalUserId,
            items: room.cartItems.map(item => ({
                food: item.foodId,
                name: `${item.name} (For: ${item.addedBy})`,
                price: item.price,
                qty: item.qty
            })),
            totalAmount,
            address: address.trim(),
            paymentMethod: paymentMethod || 'Cash on Delivery',
            status: 'Pending',
            isGroupOrder: true,
            roomCode: room.roomCode
        });

        await newOrder.save();
        room.status = 'Placed';
        await room.save();

        res.status(201).json({ message: 'Group Order Placed Successfully!', order: newOrder });
    } catch (error) {
        console.error('DETAILED CHECKOUT ERROR:', error);
        res.status(500).json({ message: 'Server Error during group checkout', error: error.message });
    }
};

module.exports = {
    createRoom,
    joinRoom,
    addItemToGroupCart,
    removeItemFromGroupCart,
    getRoomDetails,
    checkoutGroupOrder
};
