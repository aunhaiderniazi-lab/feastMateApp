const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createRoom,
    joinRoom,
    addItemToGroupCart,
    removeItemFromGroupCart,
    getRoomDetails,
    checkoutGroupOrder
} = require('../controllers/groupOrderController');

router.post('/rooms', protect, createRoom);
router.post('/rooms/:roomCode/join', protect, joinRoom);
router.post('/rooms/:roomCode/items', protect, addItemToGroupCart);
router.delete('/rooms/:roomCode/items/:itemIndex', protect, removeItemFromGroupCart);
router.get('/rooms/:roomCode', protect, getRoomDetails);
router.post('/rooms/:roomCode/checkout', protect, checkoutGroupOrder);

module.exports = router;
