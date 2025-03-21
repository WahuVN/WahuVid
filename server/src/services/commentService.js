import models from "../models/index.js";

const addComment = async (videoId, content, parentCommentId, userId) => {
    const MAX_DEPTH = 3;

    let parentComment = null;
    let newCommentLevel = 0;

    if (parentCommentId) {
        parentComment = await models.Comment.findById(parentCommentId);
        if (!parentComment) {
            throw new Error('Parent comment not found');
        }

        newCommentLevel = parentComment.level + 1;

        if (newCommentLevel >= MAX_DEPTH) {
            newCommentLevel = MAX_DEPTH - 1;
            parentCommentId = parentComment.parentCommentId;
        }
    }

    const newComment = new models.Comment({
        content,
        userId: userId,
        videoId,
        parentCommentId,
        level: newCommentLevel,
    });

    await newComment.save();
    await models.Video.findByIdAndUpdate(videoId, {
        $inc: {
            commentsCount: 1
        }
    })

    return newComment;
}

const getVideoComments = async (videoId, page, limit) => {
    try {
        const skip = (page - 1) * limit;

        const comments = await models.Comment.find({ videoId: videoId, parentCommentId: null })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return comments;
    } catch (err) {
        console.error("Error getting video comments", err);
        throw new Error("An error occurred while getting video comments");
    };
};

const getChildrenComments = async (commentId) => {
    return await models.Comment.find({parentCommentId: commentId});
};

const getComment = async (commentId) => {
    return await models.Comment.findById(commentId);
};

const isLiked = async (userId, commentId) => {
    const like = await models.Like.findOne({user: userId, targetId: commentId, targetType: 'Comment'});
    return !!like;
};

export default {
    addComment,
    getVideoComments,
    getChildrenComments,
    getComment,
    isLiked,
}
