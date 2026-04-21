const express = require('express');
const router = express.Router();
const {
  uploadReel, getFeed, getExplore, getReel,
  toggleLike, addComment, deleteReel, getTrending
} = require('../controllers/reelController');
const { protect } = require('../middleware/auth');
const { uploadVideo } = require('../config/cloudinary');

router.get('/feed', protect, getFeed);
router.get('/explore', protect, getExplore);
router.get('/trending', protect, getTrending);
router.post('/', protect, uploadVideo.single('video'), uploadReel);
router.get('/:id', protect, getReel);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deleteReel);

module.exports = router;
