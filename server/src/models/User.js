import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: String,
  createdAt: { type: Date, default: Date.now },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
});

userSchema.virtual('followers', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'following'
});

userSchema.virtual('following', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'follower'
});

userSchema.index({ username: 'text', email: 'text' });

export default mongoose.model('User', userSchema);
