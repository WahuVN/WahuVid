import models from "../models/index.js"; // Nhập models từ thư mục models

/**
 * Tìm kiếm người dùng và video theo từ khóa
 * @param {string} query - Từ khóa tìm kiếm
 * @param {number} page - Số trang (mặc định là 1)
 * @param {number} limit - Số kết quả tối đa mỗi trang (mặc định là 10)
 * @returns {Object} - Kết quả tìm kiếm gồm danh sách người dùng, video và tổng số kết quả
 */
const search = async (query, page = 1, limit = 10) => {
    const skip = (page - 1) * limit; // Tính toán số lượng kết quả cần bỏ qua

    // Truy vấn tìm kiếm người dùng theo từ khóa
    const userQuery = models.User.find(
        { $text: { $search: query } }, // Tìm kiếm theo chỉ mục toàn văn bản
        { score: { $meta: "textScore" } } // Thêm điểm số liên quan của kết quả tìm kiếm
    ).sort({ score: { $meta: "textScore" } }); // Sắp xếp theo mức độ liên quan

    // Truy vấn tìm kiếm video theo từ khóa
    const videoQuery = models.Video.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    // Thực hiện tất cả truy vấn cùng lúc để tăng hiệu suất
    const [users, videos, totalUsers, totalVideos] = await Promise.all([
        userQuery.skip(skip).limit(limit), // Lấy danh sách người dùng theo trang
        videoQuery.skip(skip).limit(limit), // Lấy danh sách video theo trang
        models.User.countDocuments({ $text: { $search: query } }), // Đếm tổng số người dùng phù hợp
        models.Video.countDocuments({ $text: { $search: query } }) // Đếm tổng số video phù hợp
    ]);

    return {
        users, // Danh sách người dùng tìm được
        videos, // Danh sách video tìm được
        totalUsers, // Tổng số người dùng khớp với từ khóa
        totalVideos // Tổng số video khớp với từ khóa
    };
};

// Xuất module để sử dụng ở nơi khác
export default {
    search
};
