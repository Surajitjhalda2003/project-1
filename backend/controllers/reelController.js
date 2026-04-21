const Reel         = require('../models/Reel');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const { checkContentSafety, deleteFromCloudinary } = require('../middleware/contentModeration');

// ─────────────────────────────────────────────────────────────────────────────
// Pexels API helper — FREE tier: 200 req/hour, 20,000 req/month
// Sign up FREE at: https://www.pexels.com/api/
// Add PEXELS_API_KEY to your .env
// ─────────────────────────────────────────────────────────────────────────────

const PEXELS_TOPICS = [
  'lifestyle', 'travel', 'nature', 'dance', 'food', 'fitness',
  'fashion', 'city', 'music', 'adventure', 'cooking', 'sports',
];
let topicCursor = 0;

const fetchPexelsVideos = async (count, pageHint = 1) => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.warn(
      '[Pexels] PEXELS_API_KEY not set — external reel feed disabled.\n' +
      '  Free API key: https://www.pexels.com/api/'
    );
    return [];
  }

  const query = PEXELS_TOPICS[topicCursor % PEXELS_TOPICS.length];
  topicCursor += 1;

  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 15)}&page=${pageHint}&size=medium`;
    const response = await fetch(url, {
      headers: { Authorization: key },
      signal:  AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      console.error(`[Pexels] HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.videos || []).map(v => {
      const videoFile =
        v.video_files.find(f => f.quality === 'sd' && f.width <= 720) ||
        v.video_files.find(f => f.quality === 'hd')                   ||
        v.video_files[0];

      const slug    = v.url.split('/').filter(Boolean).pop() || '';
      const caption = slug.replace(/-\d+$/, '').replace(/-/g, ' ');

      return {
        _id:            `pexels_${v.id}`,
        videoUrl:       videoFile?.link || '',
        caption,
        hashtags:       ['trending', query, 'discover'],
        audio:          'Pexels',
        duration:       v.duration,
        likes:          [],
        comments:       [],
        views:          0,
        isExternal:     true,
        externalSource: 'pexels',
        externalUrl:    v.url,
        userId: {
          _id:        `pexels_user_${v.user.id}`,
          username:   v.user.name,
          profilePic: '',
          isVerified: false,
          fullName:   v.user.name,
        },
        createdAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('[Pexels] Fetch error:', err.message);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────

// @POST /api/reels
exports.uploadReel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file is required. Make sure the field name is "video" and it is a valid video file.',
      });
    }

    // ── AI Content Moderation ─────────────────────────────────────────────
    const moderationResult = await checkContentSafety(req.file.path, 'video');

    if (!moderationResult.safe) {
      // Delete flagged file from Cloudinary immediately
      await deleteFromCloudinary(req.file.filename, 'video');

      return res.status(400).json({
        success: false,
        message: `This content is not valid to upload. Our AI detected ${moderationResult.reason}. Please upload appropriate and respectful content only.`,
        flagged: true,
      });
    }
    // ─────────────────────────────────────────────────────────────────────

    const { caption, hashtags, audio, duration } = req.body;
    const parsedHashtags = hashtags
      ? hashtags.split(',').map(h => h.trim().replace('#', '').toLowerCase()).filter(Boolean)
      : [];

    const reel = await Reel.create({
      userId:   req.user._id,
      videoUrl: req.file.path,
      caption:  caption  || '',
      hashtags: parsedHashtags,
      audio:    audio    || 'Original Audio',
      duration: duration || 0,
    });

    await reel.populate('userId', 'username profilePic isVerified');
    res.status(201).json({ success: true, reel });
  } catch (err) {
    console.error('uploadReel error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/reels/feed — following-based feed + Pexels fill
exports.getFeed = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    const following   = currentUser.following;

    let userReels = [];

    if (following.length > 0) {
      userReels = await Reel.find({ userId: { $in: following }, isPublic: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username profilePic isVerified fullName');
    }

    // Supplement with trending if feed is short
    if (userReels.length < limit) {
      const exclude  = userReels.map(r => r._id);
      const trending = await Reel.find({ _id: { $nin: exclude }, isPublic: true })
        .sort({ interactionScore: -1, createdAt: -1 })
        .limit(limit - userReels.length)
        .populate('userId', 'username profilePic isVerified fullName');
      userReels = [...userReels, ...trending];
    }

    // ── Pexels fill ───────────────────────────────────────────────────────
    let externalReels = [];
    if (userReels.length < limit) {
      externalReels = await fetchPexelsVideos(limit - userReels.length, page);
    }

    const reels   = [...userReels, ...externalReels];
    const hasMore = userReels.length === limit || externalReels.length > 0;

    res.json({ success: true, reels, hasMore });
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/reels/explore — trending + Pexels continuous feed
exports.getExplore = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // User-posted reels always come first
    const userReels = await Reel.find({ isPublic: true })
      .sort({ interactionScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profilePic isVerified fullName');

    // ── Pexels fill ───────────────────────────────────────────────────────
    // Always add Pexels videos so the feed is continuous even with few user reels
    const pexelsCount   = Math.max(limit - userReels.length, 5);
    const externalReels = await fetchPexelsVideos(Math.min(pexelsCount, 10), page);

    // User reels first, external fill after
    const reels   = [...userReels, ...externalReels];
    const hasMore = userReels.length === limit || externalReels.length > 0;

    res.json({ success: true, reels, hasMore });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/reels/trending
exports.getTrending = async (req, res) => {
  try {
    const reels = await Reel.find({ isPublic: true })
      .sort({ interactionScore: -1 })
      .limit(20)
      .populate('userId', 'username profilePic isVerified');
    res.json({ success: true, reels });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/reels/:id
exports.getReel = async (req, res) => {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('userId', 'username profilePic isVerified')
      .populate('comments.userId', 'username profilePic');

    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    reel.updateScore();
    await reel.save();

    res.json({ success: true, reel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/reels/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    const isLiked = reel.likes.some(id => id.toString() === req.user._id.toString());

    if (isLiked) {
      reel.likes.pull(req.user._id);
    } else {
      reel.likes.addToSet(req.user._id);
      if (reel.userId.toString() !== req.user._id.toString()) {
        const notif = await Notification.create({
          recipient: reel.userId,
          sender:    req.user._id,
          type:      'like_reel',
          reel:      reel._id,
          message:   `${req.user.username} liked your reel`,
        });
        if (req.io) req.io.to(reel.userId.toString()).emit('notification', notif);
      }
    }

    reel.updateScore();
    await reel.save();

    res.json({ success: true, action: isLiked ? 'unliked' : 'liked', likesCount: reel.likes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/reels/:id/comment
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text required' });
    }

    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    reel.comments.push({ userId: req.user._id, text: text.trim() });
    reel.updateScore();
    await reel.save();

    const populatedReel = await Reel.findById(reel._id)
      .populate('comments.userId', 'username profilePic isVerified');
    const newComment = populatedReel.comments[populatedReel.comments.length - 1];

    if (reel.userId.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: reel.userId,
        sender:    req.user._id,
        type:      'comment_reel',
        reel:      reel._id,
        message:   `${req.user.username} commented: "${text.substring(0, 50)}"`,
      });
      if (req.io) req.io.to(reel.userId.toString()).emit('notification', notif);
    }

    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/reels/:id
exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });
    if (reel.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    await reel.deleteOne();
    res.json({ success: true, message: 'Reel deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
