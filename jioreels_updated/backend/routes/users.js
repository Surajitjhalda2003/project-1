const express = require('express');
const router = express.Router();
const {
  getProfile, editProfile, toggleFollow,
  getSuggestions, getUserPosts, getUserReels, toggleSavePost
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

// ✅ FIX: Specific routes MUST come before /:username wildcard
// otherwise Express matches "suggestions" and "edit-profile" as a username
router.get('/suggestions', protect, getSuggestions);
router.put('/edit-profile', protect, uploadImage.single('profilePic'), editProfile);
router.post('/save/post/:postId', protect, toggleSavePost);
router.post('/follow/:id', protect, toggleFollow);

// Wildcard routes LAST
router.get('/:username', protect, getProfile);
router.get('/:username/posts', protect, getUserPosts);
router.get('/:username/reels', protect, getUserReels);

module.exports = router;
