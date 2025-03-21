import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    targetType: { type: String, enum: ['Video', 'Comment'] },
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetType' },
    createdAt: { type: Date, default: Date.now },
});

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model('Like', likeSchema);
