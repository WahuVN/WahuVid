import models from '../models/index.js';

/**
 * Lấy thống kê lượt xem, lượt thích và bình luận theo từng ngày cho video của người dùng.
 * @param {string} userId - ID của người dùng.
 * @param {string} startDate - Ngày bắt đầu (chuỗi ngày).
 * @param {string} endDate - Ngày kết thúc (chuỗi ngày).
 * @returns {Array} - Danh sách thống kê theo ngày.
 */
const getDailyVideoStatistics = async (userId, startDate, endDate) => {
    // Chuyển đổi startDate và endDate thành đối tượng Date để so sánh
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Tìm tất cả các video của người dùng trong khoảng thời gian đã chọn
    const videos = await models.Video.find({
        user: userId,
        createdAt: { $gte: start, $lte: end }
    });

    // Lấy danh sách ID của các video
    const videoIds = videos.map(video => video._id);

    // Mảng lưu thống kê theo từng ngày
    const dailyStats = [];

    // Lặp qua từng ngày trong khoảng thời gian
    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        // Đếm số lượt xem trong ngày
        const viewsCount = await models.View.countDocuments({
            video: { $in: videoIds },
            createdAt: { $gte: date, $lte: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
        });
        console.log('viewsCount:', viewsCount);

        // Đếm số lượt thích trong ngày
        const likesCount = await models.Like.countDocuments({
            targetId: { $in: videoIds },
            createdAt: { $gte: date, $lte: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
        });

        // Đếm số lượt bình luận trong ngày
        const commentsCount = await models.Comment.countDocuments({
            videoId: { $in: videoIds },
            createdAt: { $gte: date, $lte: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
        });

        // Tạo đối tượng thống kê cho ngày hiện tại
        const dailyStat = {
            date: new Date(date), // Ngày hiện tại
            views: viewsCount, // Tổng lượt xem trong ngày
            likes: likesCount, // Tổng lượt thích trong ngày
            comments: commentsCount // Tổng lượt bình luận trong ngày
        };

        // Thêm vào danh sách thống kê
        dailyStats.push(dailyStat);
    }

    // In ra console để kiểm tra dữ liệu
    console.log('dailyStats:', dailyStats);
    console.log('videoIds:', videoIds);

    return dailyStats;
};

// Xuất module để sử dụng ở nơi khác
export default {
    getDailyVideoStatistics,
};
