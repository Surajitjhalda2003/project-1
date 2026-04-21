const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaUrl: [{ type: String, required: true }], // supports carousel
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  caption: { type: String, maxlength: 2200, default: '' },
  hashtags: [{ type: String, lowercase: true }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  location: { type: String, default: '' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: true },
  altText: { type: String, default: '' },
}, { timestamps: true });

postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });

module.exports = mongoose.model('Post', postSchema);
