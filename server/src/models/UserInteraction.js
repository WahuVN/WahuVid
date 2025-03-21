import mongoose from "mongoose";

const userInteractionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true},
    interactionTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InteractionType', required: true },
    score: Number,
    timestamp: { type: Date, default: Date.now() }
});


userInteractionSchema.index({ userId: 1, videoId: 1 });
userInteractionSchema.index({ interactionTypeId: 1 });

export default mongoose.model('UserInteraction', userInteractionSchema);
