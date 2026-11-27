const express = require('express');
const { handleChat } = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/message', optionalAuth, handleChat);

module.exports = router;
