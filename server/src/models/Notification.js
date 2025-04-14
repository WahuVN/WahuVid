import mongoose from "mongoose"; // Nhập thư viện mongoose để làm việc với MongoDB

const NotificationSchema = new mongoose.Schema({ // Tạo schema cho thông báo
    type: { // Loại thông báo
        type: String, // Kiểu dữ liệu là chuỗi
        enum: ['NEW_FOLLOWER', 'VIDEO_LIKE', 'VIDEO_COMMENT', 'COMMENT_LIKE', 'FOLLOWED_USER_UPLOAD', 'COMMENT_REPLY'], // Danh sách các giá trị hợp lệ
        required: true // Bắt buộc phải có
    },
    content: { // Nội dung thông báo
        type: String, // Kiểu dữ liệu là chuỗi
        required: true // Bắt buộc phải có
    },
    read: { // Trạng thái đã đọc hay chưa
        type: Boolean, // Kiểu dữ liệu là boolean
        default: false // Mặc định là chưa đọc (false)
    },
    user: { // Người nhận thông báo
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId của MongoDB
        ref: 'User', // Tham chiếu đến collection User
        required: true // Bắt buộc phải có
    },
    actor: { // Người thực hiện hành động gây ra thông báo
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId của MongoDB
        ref: 'User' // Tham chiếu đến collection User
    },
    video: { // Video liên quan đến thông báo (nếu có)
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId của MongoDB
        ref: 'Video' // Tham chiếu đến collection Video
    },
    comment: { // Bình luận liên quan đến thông báo (nếu có)
        type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId của MongoDB
        ref: 'Comment' // Tham chiếu đến collection Comment
    }
}, {
    timestamps: true // Tự động thêm trường createdAt và updatedAt
});

NotificationSchema.index({ user: 1, createdAt: -1 }); // Tạo chỉ mục cho user và thời gian tạo (giảm dần)
NotificationSchema.index({ user: 1, read: 1 }); // Tạo chỉ mục cho user và trạng thái đọc

NotificationSchema.statics.createNotification = async function (data) { // Phương thức tĩnh để tạo thông báo mới
    const notification = new this(data); // Tạo instance mới từ dữ liệu đầu vào
    await notification.save(); // Lưu thông báo vào database
    return notification; // Trả về thông báo đã tạo
};

NotificationSchema.methods.markAsRead = async function () { // Phương thức instance để đánh dấu thông báo là đã đọc
    this.read = true; // Đặt trạng thái đọc thành true
    await this.save(); // Lưu thay đổi vào database
    return this; // Trả về thông báo đã cập nhật
};

NotificationSchema.virtual('url').get(function () { // Tạo trường ảo url dựa trên loại thông báo
    switch (this.type) { // Kiểm tra loại thông báo
        case 'NEW_FOLLOWER': // Nếu là người theo dõi mới
            return `/profile/${this.actor}`; // Trả về đường dẫn đến hồ sơ của actor
        case 'VIDEO_LIKE': // Nếu là lượt thích video
        case 'VIDEO_COMMENT': // Nếu là bình luận video
        case 'COMMENT_REPLY': // Nếu là trả lời bình luận
        case 'FOLLOWED_USER_UPLOAD': // Nếu người theo dõi đăng video
        case 'COMMENT_LIKE': // Nếu là lượt thích bình luận
            return `${this.actor}/video/${this.video}`; // Trả về đường dẫn đến video
        default: // Trường hợp mặc định
            return '/'; // Trả về đường dẫn gốc
    }
});

export default mongoose.model('Notification', NotificationSchema); // Xuất model Notification dựa trên schema