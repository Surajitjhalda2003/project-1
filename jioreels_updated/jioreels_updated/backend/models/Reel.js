const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const reelSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  caption: { type: String, maxlength: 2200, default: '' },
  hashtags: [{ type: String, lowercase: true }],
  audio: { type: String, default: 'Original Audio' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // seconds
  aspectRatio: { type: String, default: '9:16' },
  isPublic: { type: Boolean, default: true },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: { type: String, default: '' },
  // For recommendation system
  interactionScore: { type: Number, default: 0 },
  categoryTags: [String],
}, { timestamps: true });

// Index for performance
reelSchema.index({ userId: 1, createdAt: -1 });
reelSchema.index({ hashtags: 1 });
reelSchema.index({ interactionScore: -1 });

// Update interaction score on likes/comments/views
reelSchema.methods.updateScore = function () {
  this.interactionScore = this.likes.length * 3 + this.comments.length * 2 + this.views * 0.1 + this.shares * 4;
};

module.exports = mongoose.model('Reel', reelSchema);
