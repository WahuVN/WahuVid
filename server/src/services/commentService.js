import models from "../models/index.js"; // Nhập các model từ thư mục models

const addComment = async (videoId, content, parentCommentId, userId) => { // Hàm thêm bình luận mới
    const MAX_DEPTH = 3; // Độ sâu tối đa của bình luận lồng nhau

    let parentComment = null; // Biến lưu bình luận cha, mặc định là null
    let newCommentLevel = 0; // Cấp độ của bình luận mới, mặc định là 0

    if (parentCommentId) { // Nếu có ID bình luận cha
        parentComment = await models.Comment.findById(parentCommentId); // Tìm bình luận cha theo ID
        if (!parentComment) { // Nếu không tìm thấy bình luận cha
            throw new Error('Không tìm thấy bình luận cha'); // Ném lỗi
        }

        newCommentLevel = parentComment.level + 1; // Tăng cấp độ bình luận mới dựa trên bình luận cha

        if (newCommentLevel >= MAX_DEPTH) { // Nếu cấp độ vượt quá độ sâu tối đa
            newCommentLevel = MAX_DEPTH - 1; // Đặt lại cấp độ về mức tối đa - 1
            parentCommentId = parentComment.parentCommentId; // Sử dụng ID bình luận cha của bình luận cha
        }
    }

    const newComment = new models.Comment({ // Tạo bình luận mới
        content, // Nội dung bình luận
        userId: userId, // ID người dùng
        videoId, // ID video
        parentCommentId, // ID bình luận cha (nếu có)
        level: newCommentLevel, // Cấp độ bình luận
    });

    await newComment.save(); // Lưu bình luận mới vào database
    await models.Video.findByIdAndUpdate(videoId, { // Cập nhật số lượng bình luận của video
        $inc: { // Tăng giá trị
            commentsCount: 1 // Tăng số lượng bình luận lên 1
        }
    });

    return newComment; // Trả về bình luận mới
}

const getVideoComments = async (videoId, page, limit) => { // Hàm lấy bình luận cấp cao nhất của video
    try { // Khối try để xử lý lỗi
        const skip = (page - 1) * limit; // Tính số lượng bình luận cần bỏ qua dựa trên trang

        const comments = await models.Comment.find({ videoId: videoId, parentCommentId: null }) // Tìm bình luận gốc của video
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo giảm dần
            .skip(skip) // Bỏ qua số bình luận đã tính
            .limit(limit); // Giới hạn số lượng bình luận trả về
        return comments; // Trả về danh sách bình luận
    } catch (err) { // Bắt lỗi nếu có
        console.error("Lỗi khi lấy bình luận video", err); // Ghi log lỗi bằng tiếng Việt
        throw new Error("Đã xảy ra lỗi khi lấy bình luận video"); // Ném lỗi với thông báo tiếng Việt
    };
};

const getChildrenComments = async (commentId) => { // Hàm lấy bình luận con của một bình luận
    return await models.Comment.find({ parentCommentId: commentId }); // Tìm tất cả bình luận có parentCommentId khớp
};

const getComment = async (commentId) => { // Hàm lấy thông tin một bình luận theo ID
    return await models.Comment.findById(commentId); // Tìm bình luận theo ID và trả về
};

const isLiked = async (userId, commentId) => { // Hàm kiểm tra bình luận đã được thích bởi người dùng chưa
    const like = await models.Like.findOne({ user: userId, targetId: commentId, targetType: 'Comment' }); // Tìm lượt thích của người dùng cho bình luận
    return !!like; // Trả về true nếu có lượt thích, false nếu không
};

export default { // Xuất các hàm dưới dạng object
    addComment,
    getVideoComments,
    getChildrenComments,
    getComment,
    isLiked,
}