import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sortedParticipants: { type: String },
    type: { type: String, enum: ['direct', 'group'], default: 'direct' },
    name: { type: String, required: function () { return this.type === 'group'; } },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

conversationSchema.index({ sortedParticipants: 1, type: 1 }, { unique: true });

export default mongoose.model('Conversation', conversationSchema);
