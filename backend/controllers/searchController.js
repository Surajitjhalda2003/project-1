const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');

// @GET /api/search?q=query&type=users|posts|reels|hashtags
exports.search = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q || q.trim().length < 1) return res.status(400).json({ success: false, message: 'Search query required' });

    const query = q.trim();
    const results = {};

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } },
        ],
      }).select('username fullName profilePic isVerified followers').limit(15);
    }

    if (type === 'all' || type === 'hashtags') {
      const hashtagQuery = query.replace('#', '').toLowerCase();
      const [postsByTag, reelsByTag] = await Promise.all([
        Post.find({ hashtags: { $in: [hashtagQuery] } }).countDocuments(),
        Reel.find({ hashtags: { $in: [hashtagQuery] } }).countDocuments(),
      ]);
      results.hashtags = [{ tag: hashtagQuery, count: postsByTag + reelsByTag }];
    }

    if (type === 'reels') {
      results.reels = await Reel.find({
        $or: [
          { caption: { $regex: query, $options: 'i' } },
          { hashtags: { $in: [query.replace('#', '').toLowerCase()] } },
        ],
        isPublic: true,
      })
        .sort({ interactionScore: -1 })
        .limit(20)
        .populate('userId', 'username profilePic isVerified');
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
