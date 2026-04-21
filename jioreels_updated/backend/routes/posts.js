const express = require('express');
const router = express.Router();
const {
  createPost, getFeed, getPost,
  toggleLike, addComment, deletePost, editPost
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

router.get('/feed', protect, getFeed);
router.post('/', protect, uploadImage.array('media', 10), createPost);
router.get('/:id', protect, getPost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);
router.put('/:id', protect, editPost);
router.delete('/:id', protect, deletePost);

module.exports = router;
