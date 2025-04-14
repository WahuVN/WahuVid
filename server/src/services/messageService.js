// Import mô hình dữ liệu từ thư mục models
import models from '../models/index.js';
// Import service xử lý hội thoại
import conversationService from './conversationService.js';

/**
 * Lấy danh sách tin nhắn của một cuộc hội thoại
 * @param {String} conversationId - ID của cuộc hội thoại
 * @param {String} userId - ID của người dùng
 * @param {Number} page - Số trang (bắt đầu từ 1)
 * @param {Number} limit - Số tin nhắn trên mỗi trang (mặc định là 50)
 * @returns {Array} Danh sách tin nhắn
 */
const getConversationMessages = async (conversationId, userId, page, limit = 50) => {
    // Kiểm tra xem cuộc hội thoại có tồn tại không
    const conversation = await models.Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error('Cuộc hội thoại không tồn tại');
    }

    // Kiểm tra xem người dùng có phải là thành viên của cuộc hội thoại không
    if (!conversation.participants.includes(userId)) {
        throw new Error('Bạn không phải là thành viên của cuộc hội thoại này');
    }

    // Truy vấn tin nhắn trong cuộc hội thoại theo phân trang
    const messages = await models.Message.find({ conversation: conversationId })
        .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất trước
        .skip((page - 1) * limit) // Bỏ qua số lượng tin nhắn dựa trên trang
        .limit(limit); // Giới hạn số tin nhắn trả về

    return messages;
};

/**
 * Gửi tin nhắn trong một cuộc hội thoại
 * @param {String} senderId - ID của người gửi
 * @param {String} conversationId - ID của cuộc hội thoại
 * @param {String} content - Nội dung tin nhắn
 * @param {String} contentType - Loại nội dung (text, image, file, ...)
 * @returns {Object} Tin nhắn vừa gửi
 */
const sendMessage = async (senderId, conversationId, content, contentType) => {
    // Kiểm tra xem cuộc hội thoại có tồn tại không
    const conversation = await models.Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error('Cuộc hội thoại không tồn tại');
    }

    // Kiểm tra xem người gửi có thuộc cuộc hội thoại không
    if (!conversation.participants.includes(senderId)) {
        throw new Error('Bạn không phải là thành viên của cuộc hội thoại này');
    }

    // Tạo tin nhắn mới
    const newMessage = new models.Message({
        conversation: conversationId,
        sender: senderId,
        content: content,
        contentType: contentType,
        readBy: [senderId] // Tin nhắn được đánh dấu đã đọc bởi người gửi
    });

    await newMessage.save();

    // Cập nhật tin nhắn cuối cùng trong cuộc hội thoại
    await conversationService.updateLastMessage(conversationId, newMessage._id);

    return newMessage;
};

/**
 * Đánh dấu tin nhắn là đã đọc
 * @param {String} messageId - ID của tin nhắn
 * @param {String} userId - ID của người dùng
 * @returns {Boolean} Trả về true nếu thành công
 */
const markMessageAsRead = async (messageId, userId) => {
    // Tìm tin nhắn theo ID
    const message = await models.Message.findById(messageId);
    if (!message) {
        throw new Error('Tin nhắn không tồn tại');
    }

    // Kiểm tra xem người dùng có thuộc cuộc hội thoại không
    const conversation = await models.Conversation.findById(message.conversation);
    if (!conversation.participants.includes(userId)) {
        throw new Error('Bạn không phải là thành viên của cuộc hội thoại này');
    }

    // Nếu người dùng chưa đọc tin nhắn thì thêm vào danh sách đã đọc
    if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        await message.save();
    }

    return true;
};

/**
 * Lấy tin nhắn cuối cùng của một cuộc hội thoại
 * @param {String} conversationId - ID của cuộc hội thoại
 * @returns {Object} Tin nhắn cuối cùng
 */
const getLastMessage = async (conversationId) => {
    return await models.Message.findOne({ conversation: conversationId })
        .sort({ createdAt: -1 }); // Lấy tin nhắn mới nhất
};

// Xuất các hàm để sử dụng ở nơi khác trong ứng dụng
export default {
    getConversationMessages,
    sendMessage,
    markMessageAsRead,
    getLastMessage,
};
