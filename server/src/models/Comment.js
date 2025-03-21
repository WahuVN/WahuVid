import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    level: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

commentSchema.index({ videoId: 1, parentCommentId: 1 });

export default mongoose.model('Comment', commentSchema);
