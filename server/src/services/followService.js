import models from "../models/index.js";

// Hàm followUser: Dùng để theo dõi (follow) một người dùng khác
const followUser = async (followerId, followingId) => {
    try {
        // Kiểm tra xem đã theo dõi người dùng này trước đó chưa
        const existingFollow = await models.Follow.findOne({
            follower: followerId,   // Người theo dõi
            following: followingId  // Người được theo dõi
        });

        if (existingFollow) {
            return false; // Nếu đã theo dõi rồi, không làm gì cả
        }

        // Tạo một bản ghi mới trong bảng Follow
        const follow = new models.Follow({
            follower: followerId,
            following: followingId,
        });

        await follow.save(); // Lưu vào cơ sở dữ liệu

        // Cập nhật số lượng người đang theo dõi của followerId (+1)
        await models.User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: 1 }
        });

        // Cập nhật số lượng người theo dõi của followingId (+1)
        await models.User.findByIdAndUpdate(followingId, {
            $inc: { followerCount: 1 }
        });

        return true; // Thành công
    } catch (error) {
        console.error("Lỗi khi theo dõi người dùng", error);
        throw new Error("Không thể theo dõi người dùng");
    }
};

// Hàm unfollowUser: Dùng để hủy theo dõi một người dùng khác
const unfollowUser = async (followerId, followingId) => {
    try {
        // Tìm và xóa bản ghi theo dõi trong bảng Follow
        const result = await models.Follow.findOneAndDelete({
            follower: followerId,
            following: followingId
        });

        if (!result) {
            return false; // Nếu không tìm thấy bản ghi, không làm gì cả
        }

        // Giảm số lượng người đang theo dõi của followerId (-1)
        await models.User.findByIdAndUpdate(followerId, {
            $inc: { followingCount: -1 }
        });

        // Giảm số lượng người theo dõi của followingId (-1)
        await models.User.findByIdAndUpdate(followingId, {
            $inc: { followerCount: -1 }
        });

        return true; // Thành công
    } catch (error) {
        console.error("Lỗi khi hủy theo dõi người dùng", error);
        throw new Error("Không thể hủy theo dõi người dùng");
    }
};

// Hàm getFollowers: Lấy danh sách những người theo dõi một người dùng
const getFollowers = async (userId, first, after) => {
    try {
        const query = { following: userId }; // Truy vấn những người đang theo dõi userId
        // Cần bổ sung logic xử lý dữ liệu và phân trang tại đây
    } catch (error) {
        console.error("Lỗi khi lấy danh sách người theo dõi", error);
        throw new Error("Không thể lấy danh sách người theo dõi");
    }
};

// Hàm getFollowing: Lấy danh sách những người mà người dùng đang theo dõi
const getFollowing = async (userId) => {
    try {
        const following = await models.Follow.find({ follower: userId }).select('following');
        const followingIds = following.map(f => f.following);
        return await models.User.find({ _id: { $in: followingIds } });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách người đang theo dõi", error);
        throw new Error("Không thể lấy danh sách người đang theo dõi");
    }
};

// Xuất các hàm để sử dụng ở nơi khác
export default {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
};
