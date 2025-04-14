// Import mô hình dữ liệu từ thư mục models
import models from "../models/index.js";

// Hàm likeVideo: Thêm lượt thích cho video
const likeVideo = async (videoId, userId) => {
    try {
        // Kiểm tra xem người dùng đã thích video này chưa
        const existingLike = await models.Like.findOne({
            user: userId,
            targetId: videoId,
            targetType: 'Video'
        });

        if (existingLike) {
            return false; // Nếu đã thích trước đó, không làm gì cả
        }

        // Tạo một lượt thích mới
        const newLike = new models.Like({
            user: userId,
            targetType: 'Video',
            targetId: videoId
        });

        await newLike.save();

        // Tăng số lượt thích của video lên 1
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                likeCount: 1
            }
        });

        return true;
    } catch (error) {
        console.error("Lỗi khi thích video", error);
        return false;
    }
}

// Hàm unlikeVideo: Xóa lượt thích của video
const unlikeVideo = async (videoId, userId) => {
    // Xóa lượt thích nếu tồn tại
    const result = await models.Like.findOneAndDelete({
        user: userId,
        targetType: 'Video',
        targetId: videoId
    });

    // Nếu lượt thích đã bị xóa, giảm số lượt thích của video đi 1
    if (result) {
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                likeCount: -1
            }
        });
    }

    return !!result; // Trả về true nếu đã bỏ thích thành công, false nếu không có gì để xóa
}

// Hàm likeComment: Thêm lượt thích cho bình luận
const likeComment = async (userId, commentId) => {
    try {
        // Kiểm tra xem người dùng đã thích bình luận này chưa
        const existingLike = await models.Like.findOne({
            user: userId,
            targetId: commentId,
            targetType: 'Comment'
        });

        if (existingLike) {
            return false; // Nếu đã thích trước đó, không làm gì cả
        }

        // Tạo một lượt thích mới
        const newLike = new models.Like({
            user: userId,
            targetType: 'Comment',
            targetId: commentId
        });

        await newLike.save();

        // Tăng số lượt thích của bình luận lên 1
        await models.Comment.findByIdAndUpdate(commentId, {
            $inc: {
                likeCount: 1
            }
        });

        return true;
    } catch (error) {
        console.error("Lỗi khi thích bình luận", error);
        return false;
    }
}

// Hàm unlikeComment: Xóa lượt thích của bình luận
const unlikeComment = async (userId, commentId) => {
    // Xóa lượt thích nếu tồn tại
    const result = await models.Like.findOneAndDelete({
        user: userId,
        targetType: 'Comment',
        targetId: commentId
    });

    // Nếu lượt thích đã bị xóa, giảm số lượt thích của bình luận đi 1
    if (result) {
        await models.Comment.findByIdAndUpdate(commentId, {
            $inc: {
                likeCount: -1
            }
        });
    }

    return !!result; // Trả về true nếu đã bỏ thích thành công, false nếu không có gì để xóa
}

// Xuất các hàm để sử dụng ở nơi khác trong ứng dụng
export default {
    likeVideo,
    unlikeVideo,
    likeComment,
    unlikeComment
};
