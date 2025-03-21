import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, required: true },
    isViewed: { type: mongoose.Schema.Types.Boolean, default: false },
});

export default mongoose.model('Recommendation', recommendationSchema);
