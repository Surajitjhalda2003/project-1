const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['like_post', 'like_reel', 'comment_post', 'comment_reel', 'follow', 'mention', 'tag'],
    required: true,
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  reel: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel' },
  message: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
