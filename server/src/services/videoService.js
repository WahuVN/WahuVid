// Import thư viện mongoose để làm việc với MongoDB
import mongoose from "mongoose";
// Import các model (Video, User, View, Like, Save, Follow) từ file index.js trong thư mục models
import models from "../models/index.js";
// Import dịch vụ uploadService để xử lý việc tải file lên AWS S3
import uploadService from "./uploadService.js";

// Hàm lấy thông tin video theo ID
const getVideo = async (id) => {
    // Truy vấn video từ MongoDB bằng ID và trả về đối tượng video
    // Video sẽ bao gồm các trường như videoUrl (URL trên S3), thumbnailUrl, title, user, v.v.
    return await models.Video.findById(id);
};

// Hàm kiểm tra xem người dùng đã lưu video hay chưa
const isSaved = async (userId, videoId) => {
    // Truy vấn collection Save trong MongoDB để tìm bản ghi có userId và videoId
    const save = await models.Save.findOne({
        userId: userId,
        videoId: videoId
    });
    // Trả về true nếu đã lưu, false nếu chưa
    return !!save;
};

// Hàm kiểm tra xem người dùng đã thích video hay chưa
const isLiked = async (userId, videoId) => {
    // Truy vấn collection Like trong MongoDB để tìm bản ghi có userId, targetId (videoId) và targetType là 'Video'
    const like = await models.Like.findOne({
        user: userId,
        targetId: videoId,
        targetType: 'Video',
    });
    // Trả về true nếu đã thích, false nếu chưa
    return !!like;
};

// Hàm kiểm tra xem người dùng đã xem video hay chưa
const isViewed = async (userId, videoId) => {
    // Truy vấn collection View trong MongoDB để tìm bản ghi có userId và videoId
    const view = await models.View.findOne({
        user: userId,
        video: videoId
    });
    // Trả về true nếu đã xem, false nếu chưa
    return !!view;
};

// Hàm gợi ý video cho người dùng đã đăng nhập
const getRecommendedVideos = async (userId, limit = 10) => {
    try {
        // Lấy thông tin về các video đã xem, không quan tâm, và xem lại nhiều lần của người dùng
        const viewedVideosInfo = await models.View.aggregate([
            // Lọc các bản ghi View của người dùng
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            // Nhóm các video theo các tiêu chí
            {
                $group: {
                    _id: null,
                    // Danh sách ID các video đã xem (viewCount > 0)
                    viewedVideoIds: {
                        $push: {
                            $cond: [
                                { $gt: ["$viewCount", 0] },
                                "$video",
                                null
                            ]
                        }
                    },
                    // Danh sách ID các video không quan tâm (viewCount = 0)
                    notInterestedVideoIds: {
                        $push: {
                            $cond: [
                                { $eq: ["$viewCount", 0] },
                                "$video",
                                null
                            ]
                        }
                    },
                    // Danh sách ID các video xem lại nhiều lần (viewCount > 3)
                    replayedVideoIds: {
                        $push: {
                            $cond: [
                                { $gt: ["$viewCount", 3] },
                                "$video",
                                null
                            ]
                        }
                    }
                }
            },
            // Loại bỏ các giá trị null trong danh sách
            {
                $project: {
                    _id: 0,
                    viewedVideoIds: { $filter: { input: "$viewedVideoIds", as: "id", cond: { $ne: ["$$id", null] } } },
                    notInterestedVideoIds: { $filter: { input: "$notInterestedVideoIds", as: "id", cond: { $ne: ["$$id", null] } } },
                    replayedVideoIds: { $filter: { input: "$replayedVideoIds", as: "id", cond: { $ne: ["$$id", null] } } }
                }
            }
        ]);

        // Lấy danh sách ID từ kết quả aggregate
        const {
            viewedVideoIds = [], // Danh sách ID video đã xem
            notInterestedVideoIds = [], // Danh sách ID video không quan tâm
            replayedVideoIds = [] // Danh sách ID video xem lại nhiều lần
        } = viewedVideosInfo[0] || {};

        // Lấy danh sách ID các video đã thích
        const likedVideoIds = await models.Like.distinct('targetId', {
            user: userId,
            targetType: 'Video'
        });

        // Kết hợp danh sách video đã thích và video xem lại nhiều lần (loại bỏ trùng lặp)
        const favoritedVideoIds = [...new Set([...likedVideoIds, ...replayedVideoIds])];

        // In danh sách video đã xem để debug
        console.log(viewedVideoIds, "___________123123");

        let recommendedVideos;

        // Nếu người dùng chưa xem hoặc thích video nào
        if (viewedVideoIds.length === 0 && favoritedVideoIds.length === 0) {
            // Gợi ý video dựa trên độ phổ biến (views và likes)
            recommendedVideos = await models.Video.aggregate([
                // Loại bỏ các video không quan tâm
                {
                    $match: {
                        _id: { $nin: notInterestedVideoIds }
                    }
                },
                // Tính điểm cho video: views * 0.5 + likeCount * 2
                {
                    $addFields: {
                        score: {
                            $add: [
                                { $multiply: ['$views', 0.5] },
                                { $multiply: ['$likeCount', 2] }
                            ]
                        },
                        id: "$_id"
                    }
                },
                // Sắp xếp theo điểm giảm dần
                { $sort: { score: -1 } },
                // Giới hạn số lượng video trả về
                { $limit: limit }
            ]);
        } else {
            // Nếu người dùng đã xem hoặc thích video, gợi ý dựa trên sở thích
            const userInterests = await models.Video.aggregate([
                // Lấy các video đã xem hoặc đã thích
                {
                    $match: {
                        _id: { $in: [...viewedVideoIds, ...favoritedVideoIds] }
                    }
                },
                // Nhóm để lấy danh sách category và tags
                {
                    $group: {
                        _id: null,
                        categories: { $addToSet: '$category' },
                        tags: { $addToSet: '$tags' }
                    }
                },
                // Loại bỏ trùng lặp trong tags
                {
                    $project: {
                        _id: 0,
                        categories: 1,
                        tags: {
                            $reduce: {
                                input: '$tags',
                                initialValue: [],
                                in: { $setUnion: ['$$value', '$$this'] }
                            }
                        }
                    }
                }
            ]);

            // Lấy danh sách category và tags từ kết quả
            const { categories = [], tags = [] } = userInterests[0] || {};

            // Gợi ý video dựa trên category và tags
            recommendedVideos = await models.Video.aggregate([
                // Loại bỏ các video đã xem, đã thích, hoặc không quan tâm
                // Chỉ lấy video có category hoặc tags phù hợp
                {
                    $match: {
                        _id: {
                            $nin: [
                                ...viewedVideoIds,
                                ...favoritedVideoIds,
                                ...notInterestedVideoIds
                            ]
                        },
                        $or: [
                            { category: { $in: categories } },
                            { tags: { $in: tags } }
                        ]
                    }
                },
                // Tính điểm cho video: views * 0.5 + likeCount * 2 + 10 nếu thuộc category phù hợp
                {
                    $addFields: {
                        score: {
                            $add: [
                                { $multiply: ['$views', 0.5] },
                                { $multiply: ['$likeCount', 2] },
                                {
                                    $cond: [
                                        { $in: ['$category', categories] },
                                        10,
                                        0
                                    ]
                                },
                            ]
                        },
                        id: "$_id",
                    }
                },
                // Sắp xếp theo điểm giảm dần
                { $sort: { score: -1 } },
                // Giới hạn số lượng video trả về
                { $limit: limit },
            ]);
        }

        // Nếu số lượng video gợi ý chưa đủ
        if (recommendedVideos.length < limit) {
            // Lấy thêm video phổ biến để bổ sung
            const additionalVideos = await models.Video.aggregate([
                // Loại bỏ các video đã có trong danh sách gợi ý, đã xem, đã thích, hoặc không quan tâm
                {
                    $match: {
                        _id: {
                            $nin: [
                                ...recommendedVideos.map(v => v._id),
                                ...viewedVideoIds,
                                ...favoritedVideoIds,
                                ...notInterestedVideoIds
                            ]
                        }
                    }
                },
                // Tính điểm: views * 0.5 + likeCount * 2
                {
                    $addFields: {
                        score: {
                            $add: [
                                { $multiply: ['$views', 0.5] },
                                { $multiply: ['$likeCount', 2] }
                            ]
                        },
                        id: "$_id"
                    }
                },
                // Sắp xếp theo điểm giảm dần
                { $sort: { score: -1 } },
                // Lấy số lượng video còn thiếu
                { $limit: limit - recommendedVideos.length }
            ]);

            // Kết hợp danh sách video gợi ý và video bổ sung
            recommendedVideos = [...recommendedVideos, ...additionalVideos];
        }

        // Trả về danh sách video gợi ý
        return recommendedVideos;
    } catch (error) {
        // Ghi log lỗi và ném lỗi nếu có vấn đề
        console.error('Error getting recommended videos:', error);
        throw new Error('An error occurred while fetching recommended videos');
    }
};

// Hàm tải video lên hệ thống
const uploadVideo = async (userId, title, videoFile, thumbnailFile, category, tags) => {
    // Khởi tạo biến lưu trữ URL của video và thumbnail trên S3
    let uploadedVideoLocation = null;
    let uploadedThumbnailLocation = null;
    try {
        // Tải thumbnail lên S3 và lấy URL
        const res = await uploadService.uploadToS3(thumbnailFile, 'thumbnail');
        uploadedThumbnailLocation = res.Location;
        // Tải video lên S3 và lấy URL
        const result = await uploadService.uploadToS3(videoFile, 'video');
        uploadedVideoLocation = result.Location;

        // Tạo một bản ghi video mới trong MongoDB
        const video = new models.Video({
            user: userId,
            title,
            videoUrl: uploadedVideoLocation, // URL của video trên S3
            thumbnailUrl: uploadedThumbnailLocation, // URL của thumbnail trên S3
            tags,
            category
        });

        // In thông tin video để debug
        console.log(video);

        // Lưu video vào MongoDB
        await video.save();
        // Trả về đối tượng video
        return video;
    } catch (error) {
        // Nếu có lỗi, xóa các file đã tải lên S3 để tránh rác
        if (uploadedVideoLocation) {
            try {
                // Xóa video trên S3
                await uploadService.deleteFromS3(uploadedVideoLocation);
            } catch (deleteError) {
                console.error('Could not delete video from S3', deleteError);
            }
        }
        if (uploadedThumbnailLocation) {
            try {
                // Xóa thumbnail trên S3
                await uploadService.deleteFromS3(uploadedThumbnailLocation);
            } catch (deleteError) {
                console.error('Could not delete video from S3', deleteError);
            }
        }
        // Ghi log lỗi và ném lỗi
        console.error("Error in upload video:", error);
        throw new Error(error.message || "An error occurred during upload video");
    }
};

// Hàm lấy danh sách video của một người dùng
const getUserVideos = async (id, page, limit) => {
    try {
        // Tìm người dùng theo username hoặc ID
        let user = await models.User.findOne({ username: id });
        if (!user) {
            user = await models.User.findById(id);
        }
        // Nếu không tìm thấy người dùng, ném lỗi
        if (!user) {
            throw new Error("User not found");
        }
        // Tính số lượng bản ghi cần bỏ qua (phân trang)
        const skip = (page - 1) * limit;
        // Lấy danh sách video của người dùng, sắp xếp theo thời gian tạo giảm dần
        const videos = await models.Video.find({ user: user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Trả về danh sách video
        return videos;
    } catch (error) {
        // Ghi log lỗi và ném lỗi
        console.error('Error fetching user videos:', error);
        throw new Error('An error occurred while fetching videos');
    }
};

// Hàm lấy video tiếp theo của một người dùng
const getNextUserVideo = async (currentVideoCreatedAt, userId) => {
    try {
        // Tìm video có thời gian tạo nhỏ hơn thời gian của video hiện tại
        const video = await models.Video.findOne({
            createdAt: { $lt: currentVideoCreatedAt },
            user: userId
        }).sort({ createdAt: -1 });
        // Trả về video tiếp theo (nếu có)
        return video;
    } catch (error) {
        // Ghi log lỗi và ném lỗi
        console.error('Error get next user video:', error);
        throw new Error('An error occurred while fetching next user video');
    }
};

// Hàm lấy video trước đó của một người dùng
const getPrevUserVideo = async (currentVideoCreatedAt, userId) => {
    try {
        // Tìm video có thời gian tạo lớn hơn thời gian của video hiện tại
        const video = await models.Video.findOne({
            createdAt: {
                $gt: currentVideoCreatedAt
            },
            user: userId
        });
        // Trả về video trước đó (nếu có)
        return video;
    } catch (error) {
        // Ghi log lỗi và ném lỗi
        console.error('Error get previous user video:', error);
        throw new Error('An error occurred while fetching previous user video');
    }
};

// Hàm lấy video từ những người mà người dùng đang theo dõi
const getFollowingVideos = async (userId, limit = 10) => {
    try {
        // Lấy danh sách ID của những người mà người dùng đang theo dõi
        const following = await models.Follow.find({ follower: userId }).select('following');
        const followingIds = following.map(f => f.following);

        // Lấy danh sách ID các video đã xem
        const viewedVideos = await models.View.find({ user: userId }).select('video');
        const viewedVideoIds = viewedVideos.map(v => v.video);

        // Lấy video từ những người đang theo dõi, loại bỏ các video đã xem
        const videos = await models.Video.find({
            user: { $in: followingIds },
            _id: { $nin: viewedVideoIds }
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        // Trả về danh sách video
        return videos;
    } catch (error) {
        // Ghi log lỗi và ném lỗi
        console.error('Error fetching following videos:', error);
        throw new Error('An error occurred while fetching following videos');
    }
};

// Hàm lấy video từ bạn bè (người dùng theo dõi lẫn nhau)
const getFriendVideos = async (userId, limit = 10) => {
    try {
        // Lấy danh sách người dùng đang theo dõi và được theo dõi
        const [following, followers] = await Promise.all([
            models.Follow.find({ follower: userId }).select('following'),
            models.Follow.find({ following: userId }).select('follower'),
        ]);

        // Chuyển đổi sang mảng ObjectId
        const followingIds = following.map(f => f.following);
        const followerIds = followers.map(f => f.follower);

        // Tìm bạn bè (mutual follows) bằng cách tìm giao của hai mảng
        const mutualFriendIds = followingIds.filter(id =>
            followerIds.some(fId => fId.equals(id))
        );
        console.log("bạn bè", mutualFriendIds);
        console.log("ng tôi flow", followingIds, "___________123123");
        console.log("ng fl tôi", followerIds, "___________123123");

        if (mutualFriendIds.length === 0) return [];

        // Lấy danh sách video đã xem
        const viewedVideos = await models.View.find({ user: userId }).select('video');
        console.log("video đã xem: ", viewedVideos.map(v => v.video), "___________123123");
        const videos = await models.Video.find({
            user: { $in: mutualFriendIds },
            _id: { $nin: viewedVideos.map(v => v.video) }
        })
            .sort({ createdAt: -1 })
            .limit(limit);
        console.log("video: ", videos, "___________123123");
        // Truy vấn video từ bạn bè chưa xem
        return videos;
    } catch (error) {
        console.error('Error fetching friend videos:', error);
        throw new Error('Error getting friend videos');
    }
};
// Hàm lấy video theo danh mục
const getVideosByCategory = async (categoryId, page, limit) => {
    try {
        // Tính số lượng bản ghi cần bỏ qua (phân trang)
        const skip = (page - 1) * limit;
        // Nếu không có categoryId, lấy tất cả video
        if (categoryId === '') {
            const videos = await models.Video.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            return videos;
        }
        // Lấy video theo danh mục, sắp xếp theo thời gian tạo giảm dần
        const videos = await models.Video.find({ category: categoryId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return videos;
    } catch (error) {
        // Ghi log lỗi và ném lỗi
        console.error('Error fetching videos by category:', error);
        throw new Error('An error occurred while fetching videos by category');
    }
};

// Hàm gợi ý video cho người dùng chưa đăng nhập
const getRecommendedVideosNotLoggedIn = async (limit) => {
    try {
        // Lấy danh sách video mới nhất
        const videos = await models.Video.find()
            .sort({ createdAt: -1 })
            .limit(limit);
        return videos;
    } catch (error) {
        // Ghi log lỗi và ném lỗi
        console.error('Error fetching recommended videos:', error);
        throw new Error('An error occurred while fetching recommended videos');
    }
};

// Hàm xóa video
const deleteVideo = async (videoId, userId) => {
    try {
        const user = await models.User.findById(userId);
        const video = await models.Video.findById(videoId);
        if (!video) {
            throw new Error('Video not found');
        }
        if (video.user.toString() !== userId && user.role !== 'admin') {
            throw new Error('Bạn không có quyền xóa video này');
        }

        // Xóa tất cả comment liên quan đến video
        await models.Comment.deleteMany({ video: videoId });

        // Lấy danh sách tất cả comment của video để xóa like
        const comments = await models.Comment.find({ video: videoId });
        const commentIds = comments.map(comment => comment._id);

        // Xóa tất cả lượt thích của các comment
        if (commentIds.length > 0) {
            await models.Like.deleteMany({ target: { $in: commentIds }, type: 'Comment' });
        }

        // Xóa tất cả thông báo liên quan đến video
        await models.Notification.deleteMany({ video: videoId });

        // Xóa tất cả thông báo liên quan đến comment trong video
        if (commentIds.length > 0) {
            await models.Notification.deleteMany({ comment: { $in: commentIds } });
        }

        // Xóa tất cả lượt xem của video
        await models.View.deleteMany({ video: videoId });

        // Xóa tất cả lượt thích của video
        await models.Like.deleteMany({ target: videoId, type: 'Video' });

        // Xóa tất cả lượt lưu của video
        await models.Save.deleteMany({ video: videoId });

        // Xóa video
        await video.deleteOne();
        return true;
    } catch (error) {
        console.error('Error deleting video:', error);
        throw new Error('An error occurred while deleting video');
    }
};

// Xuất các hàm để sử dụng trong các file khác
export default {
    getVideo,
    getNextUserVideo,
    getPrevUserVideo,
    getRecommendedVideos,
    getRecommendedVideosNotLoggedIn,
    uploadVideo,
    getUserVideos,
    isSaved,
    isLiked,
    isViewed,
    getFollowingVideos,
    getFriendVideos,
    getVideosByCategory,
    deleteVideo
};