const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, chatController.handleChatMessage);

module.exports = router;