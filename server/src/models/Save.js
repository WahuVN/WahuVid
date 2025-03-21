import mongoose from "mongoose";

const saveSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    createAt: { type: Date, default: Date.now() },
});

export default mongoose.model('Save', saveSchema);
