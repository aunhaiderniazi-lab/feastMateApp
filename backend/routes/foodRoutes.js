const express = require('express');
const { getFoods, addFoodItem, deleteFoodItem } = require('../controllers/foodController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getFoods);
router.post('/add', protect, adminOnly, addFoodItem);
router.delete('/:id', protect, adminOnly, deleteFoodItem);

module.exports = router;
