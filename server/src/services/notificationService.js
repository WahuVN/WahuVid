import models from "../models/index.js";
import commentService from "./commentService.js";
import userService from "./userService.js";
import videoService from "./videoService.js";

// Lấy danh sách thông báo của người dùng (giới hạn 20 thông báo mới nhất)
const getUserNotifications = async (userId) => {
    return await models.Notification.find({ user: userId })
        .sort({ createdAt: -1 }) // Sắp xếp theo thời gian gần nhất
        .limit(20); // Giới hạn 20 thông báo
};

// Đánh dấu một thông báo là đã đọc
const markNotificationAsRead = async (notificationId, userId) => {
    const notification = await models.Notification.findOneAndUpdate(
        { user: userId, _id: notificationId },
        { $set: { read: true } }, // Cập nhật trạng thái "read"
        { new: true }
    );

    if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
    }
    return notification;
};

// Tạo thông báo khi một video được thích
const createLikeNotification = async (videoId, actorId) => {
    const video = await videoService.getVideo(videoId);
    const actor = await userService.getUserById(actorId);

    let notification = null;
    if (video?.user.toString() !== actor?.id.toString()) {
        notification = await models.Notification.createNotification({
            type: 'VIDEO_LIKE',
            content: `${actor.username} ${video.likeCount - 1 > 0 ? `và ${video.likeCount - 1} người khác` : ''} thích video ${video.title} của bạn!`,
            user: video.user,
            actor: actor.id,
            video: videoId
        });
    }
    return { notification, user: video.user };
};

// Tạo thông báo khi một bình luận được thích
const createLikeCommentNotification = async (commentId, actorId) => {
    const comment = await commentService.getComment(commentId);
    const actor = await userService.getUserById(actorId);

    let notification = null;
    if (comment?.userId.toString() !== actor?.id.toString()) {
        notification = await models.Notification.createNotification({
            type: 'COMMENT_LIKE',
            content: `${actor.username} ${comment.likeCount - 1 > 0 ? `và ${comment.likeCount - 1} người khác` : ''} thích bình luận của bạn!`,
            user: comment.userId,
            actor: actor.id,
            comment: commentId,
            video: comment.videoId
        });
    }
    return { notification, user: comment.userId };
};

// Tạo thông báo khi có bình luận hoặc phản hồi bình luận
const createVideoCommentNotification = async (videoId, parentCommentId, actorId) => {
    let pComment = null;
    if (parentCommentId) {
        pComment = await commentService.getComment(parentCommentId);
    }

    const video = await videoService.getVideo(videoId);
    const actor = await userService.getUserById(actorId);

    let notification = null;
    if (video.user?.toString() !== actor?.id.toString()) {
        notification = await models.Notification.createNotification({
            type: 'VIDEO_COMMENT',
            content: `${actor.username} ${video.commentsCount - 1 > 0 && !pComment ? `và ${video.commentsCount - 1} người khác` : ''} đã ${pComment ? 'phản hồi một bình luận trong' : 'bình luận về'} video ${video.title} của bạn!`,
            user: video.user,
            actor: actor.id,
            video: videoId
        });
    }

    let notification2 = null;
    if (pComment && pComment?.userId?.toString() !== actorId) {
        notification2 = await models.Notification.createNotification({
            type: 'COMMENT_REPLY',
            content: `${actor.username} đã phản hồi một bình luận của bạn trong video ${video.title}!`,
            user: pComment.userId,
            actor: actor.id,
            video: videoId
        });
    }
    return { notification, user: video.user, notification2, user2: pComment?.userId || null };
};

// Tạo thông báo khi một người dùng tải lên video mới
const createVideoUploadNotification = async (video, actorId, followerId) => {
    const actor = await userService.getUserById(actorId);

    let notification = null;
    if (actor && actor.id.toString() !== followerId) {
        notification = await models.Notification.createNotification({
            type: 'FOLLOWED_USER_UPLOAD',
            content: `${actor.username} đã tải lên một video mới: ${video?.title}!`,
            user: followerId,
            actor: actor.id,
            video: video.id
        });
    }
    return { notification, user: followerId };
};

// Tạo thông báo khi có người theo dõi bạn
const createNewFollowerNotification = async (followerId, followingId) => {
    const actor = await userService.getUserById(followerId);
    const following = await userService.getUserById(followingId);

    let notification = null;
    if (actor && following && actor.id.toString() !== following.id.toString()) {
        notification = await models.Notification.createNotification({
            type: 'NEW_FOLLOWER',
            content: `Người dùng ${actor.username} vừa theo dõi bạn! Bạn đã có ${following.followerCount} người theo dõi, hãy tiếp tục chia sẻ video nhé :)`,
            user: following.id,
            actor: actor.id,
        });
    }
    return { notification, user: following.id };
};

export default {
    getUserNotifications,
    markNotificationAsRead,
    createLikeNotification,
    createLikeCommentNotification,
    createVideoCommentNotification,
    createVideoUploadNotification,
    createNewFollowerNotification,
};
