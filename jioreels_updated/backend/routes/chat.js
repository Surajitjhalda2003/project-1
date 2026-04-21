const express = require('express');
const router = express.Router();
const { getConversations, getOrCreateConversation, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getOrCreateConversation);
router.post('/:conversationId/message', protect, uploadImage.single('media'), sendMessage);

module.exports = router;
