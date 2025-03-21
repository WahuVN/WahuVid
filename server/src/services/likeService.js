import models from "../models/index.js";

const likeVideo = async (videoId, userId) => {
    try {
        const existingLike = await models.Like.findOne({
            user: userId,
            targetId: videoId,
            targetType: 'Video'
        });
        if (existingLike) {
            return false;
        }
        const newLike = new models.Like({ user: userId, targetType: 'Video', targetId: videoId });
        await newLike.save();
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                likeCount: 1
            }
        });
        return true;
    } catch (error) {
        console.error("error like video", error);
        return false;
    }
}

const unlikeVideo = async (videoId, userId) => {
    const result = await models.Like.findOneAndDelete({ user: userId, targetType: 'Video', targetId: videoId });
    if(result)
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                likeCount: -1
            }
        })
    return !!result;
}

const likeComment = async (userId, commentId) => {
    try {
        const existingLike = await models.Like.findOne({
            user: userId,
            targetId: commentId,
            targetType: 'Comment'
        });
        if (existingLike) {
            return false;
        }
        const newLike = new models.Like({ user: userId, targetType: 'Comment', targetId: commentId });

        await newLike.save();
        await models.Comment.findByIdAndUpdate(commentId, {
            $inc: {
                likeCount: 1
            }
        });
        return true;
    } catch (error) {
        console.error("error like comment", error);
        return false;
    }
}

const unlikeComment = async (userId, commentId) => {
    const result = await models.Like.findOneAndDelete({ user: userId, targetType: 'Comment', targetId: commentId });
    if(result)
        await models.Comment.findByIdAndUpdate(commentId, {
            $inc: {
                likeCount: -1
            }
        })
    return !!result;
}

export default {
    likeVideo,
    unlikeVideo,
    likeComment,
    unlikeComment
}
