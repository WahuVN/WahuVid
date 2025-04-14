import models from "../models/index.js"; // Nhập models từ thư mục models

/**
 * Lưu video vào danh sách đã lưu của người dùng
 * @param {string} userId - ID của người dùng
 * @param {string} videoId - ID của video cần lưu
 * @returns {boolean} - Trả về true nếu lưu thành công, false nếu video đã được lưu trước đó
 */
const saveVideo = async (userId, videoId) => {
    try {
        // Kiểm tra xem video đã được lưu trước đó chưa
        const existingSave = await models.Save.findOne({
            userId: userId,
            videoId: videoId
        });

        if (existingSave) {
            return false; // Nếu đã lưu, không thực hiện lại
        }

        // Tạo một bản ghi lưu mới
        const save = new models.Save({
            userId: userId,
            videoId: videoId
        });

        await save.save(); // Lưu vào cơ sở dữ liệu

        // Cập nhật số lượt lưu của video
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: { savesCount: 1 } // Tăng số lượt lưu lên 1
        });

        return true; // Trả về true nếu lưu thành công
    } catch (error) {
        console.error("Lỗi khi lưu video", error);
        throw new Error("Đã xảy ra lỗi trong quá trình lưu video"); // Ném lỗi nếu có sự cố
    }
}

/**
 * Xóa video khỏi danh sách đã lưu của người dùng
 * @param {string} userId - ID của người dùng
 * @param {string} videoId - ID của video cần xóa khỏi danh sách đã lưu
 * @returns {boolean} - Trả về true nếu xóa thành công, false nếu video chưa được lưu trước đó
 */
const unsaveVideo = async (userId, videoId) => {
    try {
        // Tìm và xóa bản ghi lưu của video này
        const result = await models.Save.findOneAndDelete({
            userId: userId,
            videoId: videoId
        });

        if (!result) {
            return false; // Nếu không tìm thấy bản ghi, trả về false
        }

        // Cập nhật số lượt lưu của video (giảm đi 1)
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                savesCount: -1
            }
        });

        return true; // Trả về true nếu xóa thành công
    } catch (error) {
        console.error("Lỗi khi bỏ lưu video", error);
        throw new Error("Đã xảy ra lỗi trong quá trình bỏ lưu video"); // Ném lỗi nếu có sự cố
    }
}

// Xuất các hàm để sử dụng ở nơi khác
export default {
    saveVideo,
    unsaveVideo
}
