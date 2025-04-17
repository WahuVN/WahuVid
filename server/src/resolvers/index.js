import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs'; // Nhập GraphQLUpload để xử lý file upload
import models from '../models/index.js'; // Nhập các model từ thư mục models
import userService from '../services/userService.js'; // Nhập dịch vụ xử lý người dùng
import videoService from '../services/videoService.js'; // Nhập dịch vụ xử lý video
import likeService from '../services/likeService.js'; // Nhập dịch vụ xử lý lượt thích
import commentService from '../services/commentService.js'; // Nhập dịch vụ xử lý bình luận
import followService from '../services/followService.js'; // Nhập dịch vụ xử lý theo dõi
import categoryService from '../services/categoryService.js'; // Nhập dịch vụ xử lý danh mục
import saveService from '../services/saveService.js'; // Nhập dịch vụ xử lý lưu video
import viewService from '../services/viewService.js'; // Nhập dịch vụ xử lý lượt xem
import pubsub from './pubsub.js'; // Nhập pubsub để xử lý subscription
import messageService from '../services/messageService.js'; // Nhập dịch vụ xử lý tin nhắn
import conversationService from '../services/conversationService.js'; // Nhập dịch vụ xử lý hội thoại
import notificationService from '../services/notificationService.js'; // Nhập dịch vụ xử lý thông báo
import searchService from '../services/searchService.js'; // Nhập dịch vụ xử lý tìm kiếm
import statisticsService from '../services/statisticService.js'; // Nhập dịch vụ xử lý thống kê

const handleLinkAWS = (url) => {
    if (url) {
        if (url.includes('https://locshortvideo.com')) {
            const newUrl = url.replace("https://locshortvideo.com.s3.ap-southeast-1.amazonaws.com/", "https://s3.ap-southeast-1.amazonaws.com/locshortvideo.com/");
            return newUrl;
        }
        return url;
    }
    return null;
}
const resolvers = { // Định nghĩa các resolver cho GraphQL
    Upload: GraphQLUpload, // Gán GraphQLUpload cho kiểu Upload
    Query: { // Các truy vấn GraphQL
        getUser: async (_, { id }, { user }) => { // Truy vấn thông tin người dùng theo ID
            return userService.getUser(id, user.id); // Gọi dịch vụ lấy thông tin người dùng
        },
        verifyToken: async (_, __, context) => { // Truy vấn xác thực token
            if (!context.user) { // Kiểm tra người dùng đã đăng nhập chưa
                throw new Error('Token đã hết hạn!'); // Ném lỗi nếu token hết hạn
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return userService.getUser(context.user.id, context.user.id); // Trả về thông tin người dùng
        },
        getUserVideos: async (_, { id, page, limit }, { user }) => { // Truy vấn danh sách video của người dùng
            return videoService.getUserVideos(id, page, limit); // Gọi dịch vụ lấy video
        },
        getNextUserVideo: async (_, { currentVideoCreatedAt, userId }) => { // Truy vấn video tiếp theo của người dùng
            const createdAt = new Date(currentVideoCreatedAt); // Chuyển đổi thời gian tạo thành Date
            return videoService.getNextUserVideo(createdAt, userId); // Gọi dịch vụ lấy video tiếp theo
        },
        getVideo: async (_, { id }) => { // Truy vấn thông tin video theo ID
            return videoService.getVideo(id); // Gọi dịch vụ lấy video
        },
        getRecommendedVideos: async (_, { limit }, context) => { // Truy vấn video đề xuất khi đã đăng nhập
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để xem video đề xuất'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return videoService.getRecommendedVideos(context.user.id, limit); // Gọi dịch vụ lấy video đề xuất
        },
        getRecommendedVideosNotLoggedIn: async (_, { limit }) => { // Truy vấn video đề xuất khi chưa đăng nhập
            return videoService.getRecommendedVideosNotLoggedIn(limit); // Gọi dịch vụ lấy video đề xuất
        },
        getFollowingVideos: async (_, { limit }, context) => { // Truy vấn video từ người đang theo dõi
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để xem video từ người bạn theo dõi'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return videoService.getFollowingVideos(context.user.id, limit); // Gọi dịch vụ lấy video
        },
        getFriendVideos: async (_, { limit }, context) => { // Truy vấn video từ bạn bè
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để xem video từ bạn bè'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            console.log('getFriendVideos_________________________' + context.user.id); // In thông báo lấy video bạn bè
            return videoService.getFriendVideos(context.user.id, limit); // Gọi dịch vụ lấy video bạn bè
        },
        getCategories: async (_, __, { user, tokenError }) => { // Truy vấn danh sách danh mục
            if (tokenError) { // Kiểm tra lỗi token
                throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            }
            if (!user) { // Kiểm tra đăng nhập
                throw new Error('Không được phép truy cập'); // Ném lỗi nếu chưa đăng nhập
            }
            return categoryService.getCategories(); // Gọi dịch vụ lấy danh mục
        },
        getVideoComments: async (_, { videoId, page, limit }, context) => { // Truy vấn bình luận của video
            return commentService.getVideoComments(videoId, page, limit); // Gọi dịch vụ lấy bình luận
        },
        getUserConversations: async (_, __, { user, tokenError }) => { // Truy vấn danh sách hội thoại của người dùng
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để xem danh sách hội thoại'); // Ném lỗi nếu chưa đăng nhập
            return conversationService.getUserConversations(user.id); // Gọi dịch vụ lấy hội thoại
        },
        getConversation: async (_, { id }, { user, tokenError }) => { // Truy vấn thông tin một hội thoại
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để xem hội thoại'); // Ném lỗi nếu chưa đăng nhập
            return conversationService.getConversation(id, user.id); // Gọi dịch vụ lấy hội thoại
        },
        getConversationMessages: async (_, { conversationId, page, limit }, { user, tokenError }) => { // Truy vấn tin nhắn trong hội thoại
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để xem tin nhắn'); // Ném lỗi nếu chưa đăng nhập
            return messageService.getConversationMessages(conversationId, user.id, page, limit); // Gọi dịch vụ lấy tin nhắn
        },
        notifications: async (_, __, { user, tokenError }) => { // Truy vấn danh sách thông báo
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để xem thông báo'); // Ném lỗi nếu chưa đăng nhập
            return notificationService.getUserNotifications(user.id); // Gọi dịch vụ lấy thông báo
        },
        search: async (_, { query, page, limit }) => { // Truy vấn tìm kiếm
            return searchService.search(query, page, limit); // Gọi dịch vụ tìm kiếm
        },
        getVideosByCategory: async (_, { categoryId, page, limit }) => { // Truy vấn video theo danh mục
            return videoService.getVideosByCategory(categoryId, page, limit); // Gọi dịch vụ lấy video theo danh mục
        },
        getDailyVideoStatistics: async (_, { startDate, endDate }, context) => { // Truy vấn thống kê video hàng ngày
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để xem thống kê video hàng ngày'); // Ném lỗi nếu chưa đăng nhập
            }
            return statisticsService.getDailyVideoStatistics(context.user.id, startDate, endDate); // Gọi dịch vụ lấy thống kê
        },
        getFollowersByUserId: async (_, { userId }) => { // Truy vấn danh sách người theo dõi của người dùng
            return userService.getFollowers(userId); // Gọi dịch vụ lấy danh sách người theo dõi
        },
        getFollowingByUsername: async (_, { username }) => { // Truy vấn danh sách người theo dõi của người dùng
            return userService.getFollowings(username); // Gọi dịch vụ lấy danh sách người theo dõi
        },
    },
    Mutation: { // Các thay đổi dữ liệu GraphQL
        registerUser: async (_, { username, email, password, avatarFile }) => { // Đăng ký người dùng mới
            return userService.registerUser(username, email, password, avatarFile); // Gọi dịch vụ đăng ký người dùng
        },
        loginUser: async (_, { email, password }) => { // Đăng nhập người dùng
            return userService.loginUser(email, password); // Gọi dịch vụ đăng nhập
        },
        uploadVideo: async (_, { title, videoFile, thumbnailFile, category, tags }, context) => { // Tải video lên
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để tải video lên'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            const video = await videoService.uploadVideo(context.user.id, title, videoFile, thumbnailFile, category, tags); // Gọi dịch vụ tải video
            if (video) { // Nếu tải video thành công
                const followers = await userService.getFollowersByUserId(context.user.id); // Lấy danh sách người theo dõi

                for (const follower of followers) { // Duyệt qua từng người theo dõi
                    const { notification, user } = await notificationService.createVideoUploadNotification(video, context.user.id, follower.follower.toString()); // Tạo thông báo tải video

                    if (notification) { // Nếu tạo thông báo thành công
                        pubsub.publish(`NEW_NOTIFICATION_${follower.follower.toString()}`, { // Phát thông báo qua pubsub
                            newNotification: notification
                        });
                    }
                }
            }
            return video; // Trả về thông tin video
        },
        likeVideo: async (_, { targetId }, context) => { // Thích video
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để thích video'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            const res = likeService.likeVideo(targetId, context.user.id); // Gọi dịch vụ thích video
            if (res) { // Nếu thích video thành công
                const t = await notificationService.createLikeNotification(targetId, context.user); // Tạo thông báo lượt thích
                if (t?.user && t?.notification) // Nếu có thông báo và người nhận
                    pubsub.publish(`NEW_NOTIFICATION_${t.user}`, { // Phát thông báo qua pubsub
                        newNotification: t.notification
                    });
            }
            return res; // Trả về kết quả
        },
        unlikeVideo: async (_, { targetId }, context) => { // Bỏ thích video
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để bỏ thích video'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return likeService.unlikeVideo(targetId, context.user.id); // Gọi dịch vụ bỏ thích video
        },
        viewVideo: async (_, { videoId }, context) => { // Xem video
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để xem video'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return viewService.viewVideo(context.user.id, videoId); // Gọi dịch vụ ghi nhận lượt xem
        },
        likeComment: async (_, { targetId }, context) => { // Thích bình luận
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để thích bình luận'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            const res = likeService.likeComment(context.user.id, targetId); // Gọi dịch vụ thích bình luận
            if (res) { // Nếu thích bình luận thành công
                const { notification, user } = await notificationService.createLikeCommentNotification(targetId, context.user); // Tạo thông báo lượt thích
                pubsub.publish(`NEW_NOTIFICATION_${user}`, { // Phát thông báo qua pubsub
                    newNotification: notification
                });
            }
            return res; // Trả về kết quả
        },
        unlikeComment: async (_, { targetId }, context) => { // Bỏ thích bình luận
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để bỏ thích bình luận'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return likeService.unlikeComment(context.user.id, targetId); // Gọi dịch vụ bỏ thích bình luận
        },
        addComment: async (_, { videoId, content, parentCommentId }, context) => { // Thêm bình luận
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để bình luận video'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            let newComment = await commentService.addComment(videoId, content, parentCommentId, context.user.id); // Gọi dịch vụ thêm bình luận

            newComment = { // Chuẩn hóa dữ liệu bình luận mới
                ...newComment.toObject(),
                id: newComment._id,
                replies: [],
            };

            pubsub.publish(`COMMENT_ADDED_${videoId}`, { // Phát sự kiện thêm bình luận qua pubsub
                commentAdded: newComment,
                videoId
            });

            const { notification, user, notification2, user2 } = await notificationService.createVideoCommentNotification(videoId, parentCommentId, context.user.id); // Tạo thông báo bình luận
            if (notification && user) { // Nếu có thông báo cho người nhận đầu tiên
                pubsub.publish(`NEW_NOTIFICATION_${user}`, { // Phát thông báo qua pubsub
                    newNotification: notification
                });
            }
            if (notification2 && user2) { // Nếu có thông báo cho người nhận thứ hai
                pubsub.publish(`NEW_NOTIFICATION_${user2}`, { // Phát thông báo qua pubsub
                    newNotification: notification2
                });
            }

            return newComment; // Trả về bình luận mới
        },
        followUser: async (_, { followingId }, context) => { // Theo dõi người dùng
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để theo dõi người dùng này!'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            const res = followService.followUser(context.user.id, followingId); // Gọi dịch vụ theo dõi
            if (res) { // Nếu theo dõi thành công
                const { notification, user } = await notificationService.createNewFollowerNotification(context.user.id, followingId); // Tạo thông báo theo dõi
                if (notification) { // Nếu có thông báo
                    pubsub.publish(`NEW_NOTIFICATION_${user}`, { // Phát thông báo qua pubsub
                        newNotification: notification
                    })
                }
            }
            return res; // Trả về kết quả
        },
        unfollowUser: async (_, { followingId }, context) => { // Bỏ theo dõi người dùng
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để bỏ theo dõi người dùng này!'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return followService.unfollowUser(context.user.id, followingId); // Gọi dịch vụ bỏ theo dõi
        },
        saveVideo: async (_, { videoId }, context) => { // Lưu video
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để lưu video này!'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return saveService.saveVideo(context.user.id, videoId); // Gọi dịch vụ lưu video
        },
        unsaveVideo: async (_, { videoId }, context) => { // Bỏ lưu video
            if (!context.user) { // Kiểm tra đăng nhập
                throw new Error('Bạn phải đăng nhập để bỏ lưu video này!'); // Ném lỗi nếu chưa đăng nhập
            }
            if (context.tokenError) { // Kiểm tra lỗi token
                throw new Error(context.tokenError); // Ném lỗi nếu có lỗi token
            }
            return saveService.unsaveVideo(context.user.id, videoId); // Gọi dịch vụ bỏ lưu video
        },
        createConversation: async (_, { participantIds, type, name }, { user, tokenError }) => { // Tạo hội thoại mới
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để tạo hội thoại'); // Ném lỗi nếu chưa đăng nhập
            return conversationService.createConversation(user.id, participantIds, type, name); // Gọi dịch vụ tạo hội thoại
        },
        sendMessage: async (_, { conversationId, content, contentType }, { user, tokenError }) => { // Gửi tin nhắn
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để gửi tin nhắn'); // Ném lỗi nếu chưa đăng nhập
            const message = await messageService.sendMessage(user.id, conversationId, content, contentType); // Gọi dịch vụ gửi tin nhắn
            pubsub.publish(`NEW_MESSAGE_${conversationId}`, { newMessage: message, conversationId }); // Phát sự kiện tin nhắn mới qua pubsub
            return message; // Trả về tin nhắn
        },
        markMessageAsRead: async (_, { messageId }, { user, tokenError }) => { // Đánh dấu tin nhắn đã đọc
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để đánh dấu tin nhắn đã đọc'); // Ném lỗi nếu chưa đăng nhập
            return messageService.markMessageAsRead(messageId, user.id); // Gọi dịch vụ đánh dấu đã đọc
        },
        getOrCreateDirectConversation: async (_, { userId }, { user, tokenError }) => { // Lấy hoặc tạo hội thoại trực tiếp
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để tạo hội thoại'); // Ném lỗi nếu chưa đăng nhập
            const u = await userService.getUser(userId); // Lấy thông tin người dùng
            return conversationService.getOrCreateDirectConversation(user.id, u._id); // Gọi dịch vụ lấy hoặc tạo hội thoại
        },
        markNotificationAsRead: async (_, { notificationId }, { user, tokenError }) => { // Đánh dấu thông báo đã đọc
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để đánh dấu thông báo này đã đọc'); // Ném lỗi nếu chưa đăng nhập
            return notificationService.markNotificationAsRead(notificationId, user.id); // Gọi dịch vụ đánh dấu đã đọc
        },
        deleteVideo: async (_, { videoId }, { user, tokenError }) => { // Xóa video
            if (tokenError) throw new Error(tokenError); // Ném lỗi nếu có lỗi token
            if (!user) throw new Error('Bạn phải đăng nhập để xóa video'); // Ném lỗi nếu chưa đăng nhập
            return videoService.deleteVideo(videoId, user.id); // Gọi dịch vụ xóa video
        },
    },

    User: { // Resolver cho đối tượng User
        isFollowed: async (parent, _, context) => { // Kiểm tra xem người dùng đã được theo dõi chưa
            if (!context.user) { // Nếu chưa đăng nhập
                return false; // Trả về false
            }
            const follower = await models.Follow.findOne({ // Tìm quan hệ theo dõi
                follower: context.user.id,
                following: parent._id
            });
            return !!follower; // Trả về true nếu có, false nếu không
        },
        profilePicture: (parent, _, context) => { // Lấy ảnh đại diện của người dùng
            return handleLinkAWS(parent.profilePicture); // Gọi hàm xử lý đường dẫn ảnh
        }
    },
    Video: { // Resolver cho đối tượng Video
        user: async (parent, _) => { // Lấy thông tin người đăng video
            return await models.User.findById(parent.user); // Tìm người dùng theo ID
        },
        isViewed: async (parent, _, context) => { // Kiểm tra video đã được xem chưa
            if (!context.user) { // Nếu chưa đăng nhập
                return false; // Trả về false
            }
            return videoService.isViewed(context.user.id, parent._id); // Gọi dịch vụ kiểm tra lượt xem
        },
        isLiked: async (parent, _, context) => { // Kiểm tra video đã được thích chưa
            if (!context.user) { // Nếu chưa đăng nhập
                return false; // Trả về false
            }
            return videoService.isLiked(context.user.id, parent._id); // Gọi dịch vụ kiểm tra lượt thích
        },
        isSaved: async (parent, _, context) => { // Kiểm tra video đã được lưu chưa
            if (!context.user) { // Nếu chưa đăng nhập
                return false; // Trả về false
            }
            return videoService.isSaved(context.user.id, parent._id); // Gọi dịch vụ kiểm tra trạng thái lưu
        },
        category: async (parent, _) => { // Lấy danh mục của video
            return categoryService.getCategory(parent.category); // Gọi dịch vụ lấy danh mục
        },
        nextVideo: async (parent, _) => { // Lấy video tiếp theo
            return videoService.getNextUserVideo(parent.createdAt, parent.user._id); // Gọi dịch vụ lấy video tiếp theo
        },
        prevVideo: async (parent, _) => { // Lấy video trước đó
            return videoService.getPrevUserVideo(parent.createdAt, parent.user._id); // Gọi dịch vụ lấy video trước đó
        },
        videoUrl: (parent, _) => { // Lấy đường dẫn video
            return handleLinkAWS(parent.videoUrl); // Gọi hàm xử lý đường dẫn video
        },
        thumbnailUrl: (parent, _) => { // Lấy đường dẫn ảnh thu nhỏ
            return handleLinkAWS(parent.thumbnailUrl); // Gọi hàm xử lý đường dẫn ảnh
        },
    },
    Comment: { // Resolver cho đối tượng Comment
        replies: (parent, _) => { // Lấy danh sách bình luận con
            return commentService.getChildrenComments(parent._id); // Gọi dịch vụ lấy bình luận con
        },
        user: async (parent, _) => { // Lấy thông tin người bình luận
            return userService.getUser(parent.userId); // Gọi dịch vụ lấy người dùng
        },
        parentComment: async (parent, _) => { // Lấy thông tin bình luận cha
            return commentService.getComment(parent.parentCommentId); // Gọi dịch vụ lấy bình luận cha
        },
        isLiked: async (parent, _, context) => { // Kiểm tra bình luận đã được thích chưa
            return commentService.isLiked(context.user.id, parent._id); // Gọi dịch vụ kiểm tra lượt thích
        },
    },
    Conversation: { // Resolver cho đối tượng Conversation
        participants: async (parent, _, { user }) => { // Lấy danh sách người tham gia hội thoại
            return userService.getUsersByIds(parent.participants); // Gọi dịch vụ lấy người dùng theo IDs
        },
        lastMessage: async (parent, _, { user }) => { // Lấy tin nhắn cuối cùng
            return messageService.getLastMessage(parent.id); // Gọi dịch vụ lấy tin nhắn cuối
        },
    },
    Message: { // Resolver cho đối tượng Message
        sender: async (parent, _, { user }) => { // Lấy thông tin người gửi tin nhắn
            return userService.getUser(parent.sender); // Gọi dịch vụ lấy người dùng
        },
        readBy: async (parent, _, { user }) => { // Lấy danh sách người đã đọc tin nhắn
            return userService.getUsersByIds(parent.readBy); // Gọi dịch vụ lấy người dùng theo IDs
        },
    },
    Notification: { // Resolver cho đối tượng Notification
        user: async (parent, _) => { // Lấy thông tin người nhận thông báo
            return userService.getUser(parent.user); // Gọi dịch vụ lấy người dùng
        },
        actor: async (parent, _) => { // Lấy thông tin người thực hiện hành động
            return userService.getUser(parent.actor); // Gọi dịch vụ lấy người dùng
        },
        video: async (parent, _) => { // Lấy thông tin video liên quan
            return videoService.getVideo(parent.video); // Gọi dịch vụ lấy video
        },
        comment: async (parent, _) => { // Lấy thông tin bình luận liên quan
            return commentService.getComment(parent.comment); // Gọi dịch vụ lấy bình luận
        },
    },
    Subscription: { // Định nghĩa các subscription GraphQL
        commentAdded: { // Subscription cho sự kiện thêm bình luận
            subscribe: (_, { videoId }, context) => { // Đăng ký lắng nghe sự kiện
                console.log('Đăng ký subscription cho video ' + videoId); // In thông báo đăng ký subscription
                return pubsub.asyncIterator(`COMMENT_ADDED_${videoId}`); // Trả về iterator cho sự kiện
            },
        },
        newMessage: { // Subscription cho tin nhắn mới
            subscribe: (_, { conversationId }, context) => { // Đăng ký lắng nghe tin nhắn mới
                return pubsub.asyncIterator(`NEW_MESSAGE_${conversationId}`); // Trả về iterator cho sự kiện
            },
        },
        conversationUpdated: { // Subscription cho cập nhật hội thoại
            subscribe: (_, { conversationId }, context) => { // Đăng ký lắng nghe cập nhật hội thoại
                return pubsub.asyncIterator(`CONVERSATION_UPDATED_${conversationId}`); // Trả về iterator cho sự kiện
            },
        },
        newNotification: { // Subscription cho thông báo mới
            subscribe: (_, __, { user, tokenError }) => { // Đăng ký lắng nghe thông báo mới
                if (!user) throw new Error("Yêu cầu xác thực"); // Ném lỗi nếu chưa đăng nhập
                return pubsub.asyncIterator(`NEW_NOTIFICATION_${user.id}`); // Trả về iterator cho sự kiện
            },
        },
    },
};

export default resolvers; // Xuất các resolver