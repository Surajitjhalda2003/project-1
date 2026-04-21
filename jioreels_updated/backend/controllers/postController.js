const Post         = require('../models/Post');
const Notification = require('../models/Notification');
const User         = require('../models/User');
const { checkContentSafety, deleteFromCloudinary } = require('../middleware/contentModeration');

// @POST /api/posts
exports.createPost = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one media file is required' });
    }

    // ── AI Content Moderation ─────────────────────────────────────────────
    // Scan every uploaded image for nudity / vulgar content
    for (const file of req.files) {
      const moderationResult = await checkContentSafety(file.path, 'image');

      if (!moderationResult.safe) {
        // Delete ALL uploaded files from Cloudinary before returning error
        await Promise.all(
          req.files.map(f => deleteFromCloudinary(f.filename, 'image'))
        );

        return res.status(400).json({
          success: false,
          message: `This content is not valid to upload. Our AI detected ${moderationResult.reason}. Please upload appropriate and respectful content only.`,
          flagged: true,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    const { caption, hashtags, location } = req.body;
    const mediaUrls      = req.files.map(f => f.path);
    const parsedHashtags = hashtags
      ? hashtags.split(',').map(h => h.trim().replace('#', '').toLowerCase()).filter(Boolean)
      : [];

    const post = await Post.create({
      userId:   req.user._id,
      mediaUrl: mediaUrls,
      caption:  caption   || '',
      hashtags: parsedHashtags,
      location: location  || '',
    });

    await post.populate('userId', 'username profilePic isVerified');
    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/posts/feed
exports.getFeed = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    const following   = [...currentUser.following, req.user._id];

    const posts = await Post.find({ userId: { $in: following }, isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePic isVerified fullName')
      .populate('comments.userId', 'username profilePic');

    const total = await Post.countDocuments({ userId: { $in: following } });
    res.json({ success: true, posts, hasMore: skip + posts.length < total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/posts/:id
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username profilePic isVerified')
      .populate('comments.userId', 'username profilePic');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const isLiked = post.likes.some(id => id.toString() === req.user._id.toString());

    if (isLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.addToSet(req.user._id);
      if (post.userId.toString() !== req.user._id.toString()) {
        const notif = await Notification.create({
          recipient: post.userId,
          sender:    req.user._id,
          type:      'like_post',
          post:      post._id,
          message:   `${req.user.username} liked your post`,
        });
        if (req.io) req.io.to(post.userId.toString()).emit('notification', notif);
      }
    }

    await post.save();
    res.json({ success: true, action: isLiked ? 'unliked' : 'liked', likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/posts/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.comments.push({ userId: req.user._id, text: text.trim() });
    await post.save();

    const populated  = await Post.findById(post._id).populate('comments.userId', 'username profilePic');
    const newComment = populated.comments[populated.comments.length - 1];

    if (post.userId.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: post.userId,
        sender:    req.user._id,
        type:      'comment_post',
        post:      post._id,
        message:   `${req.user.username} commented: "${text.substring(0, 50)}"`,
      });
      if (req.io) req.io.to(post.userId.toString()).emit('notification', notif);
    }

    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/posts/:id
exports.editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { caption, hashtags, location } = req.body;
    if (caption  !== undefined) post.caption  = caption;
    if (location !== undefined) post.location = location;
    if (hashtags !== undefined) {
      post.hashtags = hashtags
        .split(',').map(h => h.trim().replace('#','').toLowerCase()).filter(Boolean);
    }
    await post.save();
    await post.populate('userId', 'username profilePic isVerified');
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
