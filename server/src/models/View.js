import mongoose from "mongoose";

const viewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    viewCount: {
        type: Number,
        default: 0
    }
});

viewSchema.index({user: 1, video: 1}, {unique: true});

export default mongoose.model('View', viewSchema);
