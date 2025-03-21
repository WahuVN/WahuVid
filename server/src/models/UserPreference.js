import mongoose from "mongoose";

const userPreferenceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    score: Number,
});

export default mongoose.model('UserPreference', userPreferenceSchema);
