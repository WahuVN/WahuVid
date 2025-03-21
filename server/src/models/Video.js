import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: String,
  duration: { type: Number },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [String],
  likeCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  savesCount: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

videoSchema.index({ title: 'text', tags: 'text' });

export default mongoose.model('Video', videoSchema);
