const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_.]+$/, 'Username can only contain letters, numbers, underscores, and periods'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  fullName: { type: String, trim: true, maxlength: 60 },
  profilePic: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1/jioreels/defaults/avatar.png',
  },
  bio: { type: String, maxlength: 150, default: '' },
  website: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  savedReels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reel' }],
  isVerified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for post count
userSchema.virtual('followersCount').get(function () {
  return this.followers.length;
});
userSchema.virtual('followingCount').get(function () {
  return this.following.length;
});

module.exports = mongoose.model('User', userSchema);
