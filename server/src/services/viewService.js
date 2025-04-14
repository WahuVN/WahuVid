import models from "../models/index.js"

/**
 * Hàm xử lý khi người dùng xem video.
 * - Nếu video đã từng được xem trước đó, tăng số lượt xem (`viewCount`) lên 1.
 * - Nếu video chưa từng được xem, tạo một bản ghi mới với số lượt xem là 1.
 * - Cập nhật số lượt xem tổng thể (`views`) của video trong bảng Video.
 *
 * @param {string} userId - ID của người dùng.
 * @param {string} videoId - ID của video.
 * @returns {boolean} - Trả về `true` nếu cập nhật thành công, `false` nếu có lỗi xảy ra.
 */
const viewVideo = async (userId, videoId) => {
    try {
        // Kiểm tra xem người dùng đã từng xem video này chưa
        const existView = await models.View.findOne({
            user: userId,
            video: videoId
        });

        if (existView) {
            // Nếu đã từng xem, tăng số lượt xem của người dùng cho video đó lên 1
            console.log("Video đã tồn tại trong lịch sử xem của người dùng.");
            await models.View.updateOne(
                { _id: existView._id },  // Tìm bản ghi theo ID
                { $inc: { viewCount: 1 } } // Tăng `viewCount` thêm 1
            );
        } else {
            // Nếu chưa từng xem, tạo một bản ghi mới với `viewCount = 1`
            console.log("Video chưa tồn tại trong lịch sử xem, tạo mới.");
            const newView = new models.View({
                user: userId,
                video: videoId,
                viewCount: 1
            });
            await newView.save(); // Lưu bản ghi vào cơ sở dữ liệu
        }

        // Cập nhật tổng số lượt xem của video trong bảng Video
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: { views: 1 } // Tăng `views` tổng thể lên 1
        });

        return true; // Thành công
    } catch (error) {
        console.error("Lỗi khi cập nhật lượt xem video:", error);
        return false; // Thất bại
    }
}

export default {
    viewVideo
}
