import mongoose from "mongoose"; // Nhập thư viện mongoose để làm việc với MongoDB

const categorySchema = new mongoose.Schema({ // Định nghĩa schema cho danh mục
    name: { type: String, required: true }, // Tên danh mục, kiểu chuỗi, bắt buộc
    description: { type: String, required: true } // Mô tả danh mục, kiểu chuỗi, bắt buộc
});

const commentSchema = new mongoose.Schema({ // Định nghĩa schema cho bình luận
    content: String, // Nội dung bình luận, kiểu chuỗi
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID người dùng, tham chiếu đến User
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }, // ID video, tham chiếu đến Video
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // ID bình luận cha, tham chiếu đến Comment
    level: { type: Number, default: 0 }, // Cấp độ bình luận, mặc định là 0
    createdAt: { type: Date, default: Date.now }, // Thời gian tạo, mặc định là thời điểm hiện tại
});

commentSchema.index({ videoId: 1, parentCommentId: 1 }); // Tạo chỉ mục cho videoId và parentCommentId
const followSchema = new mongoose.Schema({ // Định nghĩa schema cho quan hệ theo dõi
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID người theo dõi, tham chiếu đến User
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID người được theo dõi, tham chiếu đến User
    createdAt: { type: Date, default: Date.now } // Thời gian tạo, mặc định là thời điểm hiện tại
});

followSchema.index({ follower: 1, following: 1 }, { unique: true }); // Tạo chỉ mục duy nhất cho follower và following
const interactionTypeSchema = new mongoose.Schema({ // Định nghĩa schema cho loại tương tác
    name: { type: String, required: true }, // Tên loại tương tác, kiểu chuỗi, bắt buộc
    description: String // Mô tả loại tương tác, kiểu chuỗi
});
const likeSchema = new mongoose.Schema({ // Định nghĩa schema cho lượt thích
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID người dùng, tham chiếu đến User
    targetType: { type: String, enum: ['Video', 'Comment'] }, // Loại mục tiêu, chỉ nhận Video hoặc Comment
    targetId: { type: mongoose.Schema.Types.ObjectId, refPath: 'targetType' }, // ID mục tiêu, tham chiếu động theo targetType
    createdAt: { type: Date, default: Date.now }, // Thời gian tạo, mặc định là thời điểm hiện tại
});

likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true }); // Tạo chỉ mục duy nhất cho userId, targetType, targetId
const recommendationSchema = new mongoose.Schema({ // Định nghĩa schema cho đề xuất
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID người dùng, kiểu ObjectId, bắt buộc
    videoId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID video, kiểu ObjectId, bắt buộc
    isViewed: { type: mongoose.Schema.Types.Boolean, default: false }, // Trạng thái đã xem, mặc định là false
});
const saveSchema = new mongoose.Schema({ // Định nghĩa schema cho video đã lưu
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID người dùng, tham chiếu đến User
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }, // ID video, tham chiếu đến Video
    createAt: { type: Date, default: Date.now() }, // Thời gian tạo, mặc định là thời điểm hiện tại
});
const userSchema = new mongoose.Schema({ // Định nghĩa schema cho người dùng
    username: { type: String, required: true, unique: true }, // Tên người dùng, bắt buộc, duy nhất
    email: { type: String, required: true, unique: true }, // Email, bắt buộc, duy nhất
    password: { type: String, required: true }, // Mật khẩu, bắt buộc
    profilePicture: String, // Ảnh hồ sơ, kiểu chuỗi
    createdAt: { type: Date, default: Date.now }, // Thời gian tạo, mặc định là thời điểm hiện tại
});
const userInteractionSchema = new mongoose.Schema({ // Định nghĩa schema cho tương tác của người dùng
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID người dùng, tham chiếu đến User, bắt buộc
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true }, // ID video, tham chiếu đến Video, bắt buộc
    interactionTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'InteractionType', required: true }, // ID loại tương tác, tham chiếu đến InteractionType, bắt buộc
    score: Number, // Điểm số tương tác, kiểu số
    timestamp: { type: Date, default: Date.now() } // Thời gian tương tác, mặc định là thời điểm hiện tại
});


userInteractionSchema.index({ userId: 1, videoId: 1 }); // Tạo chỉ mục cho userId và videoId
userInteractionSchema.index({ interactionTypeId: 1 }); // Tạo chỉ mục cho interactionTypeId
const userPreferenceSchema = new mongoose.Schema({ // Định nghĩa schema cho sở thích người dùng
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID người dùng, tham chiếu đến User, bắt buộc
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // ID danh mục, tham chiếu đến Category, bắt buộc
    score: Number, // Điểm số sở thích, kiểu số
});

const videoSchema = new mongoose.Schema({ // Định nghĩa schema cho video
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID người dùng, tham chiếu đến User, bắt buộc
    title: { type: String, required: true }, // Tiêu đề video, bắt buộc
    videoKey: { type: String, required: true }, // Khóa video, bắt buộc
    thumbnailUrl: String, // URL ảnh thu nhỏ, kiểu chuỗi
    duration: { type: Number, required: true }, // Thời lượng video, bắt buộc
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Danh mục, tham chiếu đến Category
    tags: [String], // Danh sách thẻ, mảng chuỗi
    likeCount: { type: Number, default: 0 }, // Số lượt thích, mặc định 0
    views: { type: Number, default: 0 }, // Số lượt xem, mặc định 0
    commentsCount: { type: Number, default: 0 }, // Số bình luận, mặc định 0
    savesCount: { type: Number, default: 0 }, // Số lượt lưu, mặc định 0
    engagementRate: { type: Number, default: 0 }, // Tỷ lệ tương tác, mặc định 0
    createdAt: { type: Date, default: Date.now }, // Thời gian tạo, mặc định là thời điểm hiện tại
});



import mongoose from "mongoose"; // Nhập lại mongoose (giữ nguyên như code gốc)

const NotificationSchema = new mongoose.Schema({ // Định nghĩa schema cho thông báo
    type: { // Loại thông báo
        type: String, // Kiểu chuỗi
        enum: ['NEW_FOLLOWER', 'VIDEO_LIKE', 'VIDEO_COMMENT', 'COMMENT_LIKE', 'FOLLOWED_USER_UPLOAD', 'COMMENT_REPLY'], // Danh sách giá trị hợp lệ
        required: true // Bắt buộc
    },
    content: { // Nội dung thông báo
        type: String, // Kiểu chuỗi
        required: true // Bắt buộc
    },
    read: { // Trạng thái đã đọc
        type: Boolean, // Kiểu boolean
        default: false // Mặc định là chưa đọc
    },
    user: { // Người nhận thông báo
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId
        ref: 'User', // Tham chiếu đến User
        required: true // Bắt buộc
    },
    actor: { // Người thực hiện hành động
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId
        ref: 'User' // Tham chiếu đến User
    },
    video: { // Video liên quan
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId
        ref: 'Video' // Tham chiếu đến Video
    },
    comment: { // Bình luận liên quan
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId
        ref: 'Comment' // Tham chiếu đến Comment
    }
}, { // Tùy chọn schema
    timestamps: true // Tự động thêm createdAt và updatedAt
});

const messageSchema = new mongoose.Schema({ // Định nghĩa schema cho tin nhắn
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true }, // ID cuộc hội thoại, tham chiếu đến Conversation, bắt buộc
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID người gửi, tham chiếu đến User, bắt buộc
    content: { type: String, required: true }, // Nội dung tin nhắn, bắt buộc
    contentType: { type: String, enum: ['text', 'image', 'file'], default: 'text' }, // Loại nội dung, mặc định là text
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách người đã đọc, tham chiếu đến User
    createdAt: { type: Date, default: Date.now } // Thời gian tạo, mặc định là thời điểm hiện tại
});

const conversationSchema = new mongoose.Schema({ // Định nghĩa schema cho cuộc hội thoại
    participants: [{ // Danh sách người tham gia
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId
        ref: 'User' // Tham chiếu đến User
    }],
    sortedParticipants: { type: String }, // Chuỗi danh sách người tham gia đã sắp xếp
    type: { type: String, enum: ['direct', 'group'], default: 'direct' }, // Loại hội thoại, mặc định là direct
    name: { type: String, required: function () { return this.type === 'group'; } }, // Tên nhóm, bắt buộc nếu là group
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, // Tin nhắn cuối, tham chiếu đến Message
    createdAt: { type: Date, default: Date.now }, // Thời gian tạo, mặc định là thời điểm hiện tại
    updatedAt: { type: Date, default: Date.now } // Thời gian cập nhật, mặc định là thời điểm hiện tại
});

const viewSchema = new mongoose.Schema({ // Định nghĩa schema cho lượt xem
    user: { // Người xem
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId
        ref: 'User', // Tham chiếu đến User
        required: true // Bắt buộc
    },
    video: { // Video được xem
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId
        ref: 'Video', // Tham chiếu đến Video
        required: true // Bắt buộc
    },
    viewCount: { // Số lượt xem
        type: Number, // Kiểu số
        default: 0 // Mặc định là 0
    }
});