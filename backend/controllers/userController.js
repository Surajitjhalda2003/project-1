const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Notification = require('../models/Notification');

// @GET /api/users/:username
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username profilePic fullName isVerified')
      .populate('following', 'username profilePic fullName isVerified');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [postCount, reelCount] = await Promise.all([
      Post.countDocuments({ userId: user._id }),
      Reel.countDocuments({ userId: user._id }),
    ]);

    res.json({ success: true, user, postCount, reelCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/users/edit-profile
exports.editProfile = async (req, res) => {
  try {
    const { fullName, username, bio, website } = req.body;
    const updateData = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;

    if (username && username !== req.user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(400).json({ success: false, message: 'Username already taken' });
      updateData.username = username;
    }

    // ✅ FIX: Cloudinary gives us req.file.path (the secure URL)
    if (req.file) {
      updateData.profilePic = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (err) {
    console.error('editProfile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/users/follow/:id
exports.toggleFollow = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    // ✅ FIX: .toString() comparison for ObjectId arrays
    const isFollowing = currentUser.following.some(
      (id) => id.toString() === req.params.id
    );

    if (isFollowing) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
      return res.json({ success: true, action: 'unfollowed' });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $addToSet: { followers: req.user._id } });

      // Create notification
      const notif = await Notification.create({
        recipient: req.params.id,
        sender: req.user._id,
        type: 'follow',
        message: `${req.user.username} started following you`,
      });

      if (req.io) req.io.to(req.params.id).emit('notification', notif);
      return res.json({ success: true, action: 'followed' });
    }
  } catch (err) {
    console.error('toggleFollow error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const suggestions = await User.find({
      _id: { $nin: [...currentUser.following, req.user._id] },
    })
      .select('username fullName profilePic isVerified followers')
      .limit(10)
      .sort({ createdAt: -1 });

    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/:username/posts
exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip  = (page - 1) * limit;

    const posts = await Post.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePic isVerified');

    const total = await Post.countDocuments({ userId: user._id });
    res.json({ success: true, posts, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/:username/reels
exports.getUserReels = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip  = (page - 1) * limit;

    const reels = await Reel.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePic isVerified');

    const total = await Reel.countDocuments({ userId: user._id });
    res.json({ success: true, reels, hasMore: skip + reels.length < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/users/save/:postId
exports.toggleSavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts.some(
      (id) => id.toString() === req.params.postId
    );
    const action = isSaved ? '$pull' : '$addToSet';
    await User.findByIdAndUpdate(req.user._id, { [action]: { savedPosts: req.params.postId } });
    res.json({ success: true, action: isSaved ? 'unsaved' : 'saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
