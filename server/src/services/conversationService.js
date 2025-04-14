// Import mô hình dữ liệu từ thư mục models
import models from "../models/index.js";

// Hàm getUserConversations: Lấy danh sách các cuộc trò chuyện của người dùng, sắp xếp theo thời gian cập nhật gần nhất
const getUserConversations = async (userId) => {
    return await models.Conversation.find({
        participants: userId
    }).sort({
        updatedAt: -1 // Sắp xếp theo thời gian cập nhật mới nhất
    });
};

// Hàm getOrCreateDirectConversation: Lấy hoặc tạo một cuộc trò chuyện trực tiếp giữa hai người dùng
const getOrCreateDirectConversation = async (userId1, userId2) => {
    // Sắp xếp ID của hai người dùng để đảm bảo thứ tự không thay đổi khi tìm kiếm
    const sortedParticipants = [userId1, userId2].sort().join(',');

    // Tìm cuộc trò chuyện trực tiếp giữa hai người dùng
    let conversation = await models.Conversation.findOne({
        type: 'direct',
        sortedParticipants: sortedParticipants
    });

    // Nếu chưa tồn tại, tạo mới cuộc trò chuyện
    if (!conversation) {
        conversation = new models.Conversation({
            type: 'direct',
            participants: [userId1, userId2],
            sortedParticipants: sortedParticipants
        });
        await conversation.save();
    }

    return conversation;
};

// Hàm searchConversations: Tìm kiếm cuộc trò chuyện theo tên hoặc kiểm tra nếu đó là cuộc trò chuyện trực tiếp
const searchConversations = async (userId, searchTerm) => {
    return await models.Conversation.find({
        participants: userId,
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } }, // Tìm theo tên cuộc trò chuyện (không phân biệt chữ hoa/thường)
            { type: 'direct' } // Hoặc là cuộc trò chuyện trực tiếp
        ]
    });
};

// Hàm getConversationMessages: Lấy danh sách tin nhắn của một cuộc trò chuyện, sắp xếp theo thời gian gửi mới nhất
const getConversationMessages = async (conversationId, limit = 50, skip = 0) => {
    return await models.Message.find({ conversation: conversationId })
        .sort({ createdAt: -1 }) // Sắp xếp theo thứ tự mới nhất
        .skip(skip) // Bỏ qua một số tin nhắn (hỗ trợ phân trang)
        .limit(limit); // Giới hạn số lượng tin nhắn trả về
};

// Hàm getConversation: Lấy chi tiết một cuộc trò chuyện theo ID
const getConversation = async (conversationId, userId) => {
    const conversation = await models.Conversation.findById(conversationId);

    if (!conversation) {
        throw new Error('Không tìm thấy cuộc trò chuyện');
    }

    // Kiểm tra xem người dùng có phải là thành viên của cuộc trò chuyện không (có thể mở lại nếu cần)
    // if (!conversation.participants.some(p => p._id.toString() === userId)) {
    //     throw new Error('Bạn không phải là thành viên của cuộc trò chuyện này');
    // }

    return conversation;
};

// Hàm createConversation: Tạo cuộc trò chuyện mới (có thể là nhóm hoặc cuộc trò chuyện trực tiếp)
const createConversation = async (creatorId, participantIds, type, name) => {
    console.log(creatorId, participantIds, "________123__________________");

    // Đảm bảo danh sách người tham gia không bị trùng lặp
    const allParticipants = [...new Set([creatorId, ...participantIds])];

    // Kiểm tra nếu là cuộc trò chuyện trực tiếp nhưng có nhiều hơn 2 người tham gia
    if (type === 'direct' && allParticipants.length !== 2) {
        throw new Error('Cuộc trò chuyện trực tiếp chỉ có thể có đúng 2 người tham gia');
    }

    // Kiểm tra xem cuộc trò chuyện này đã tồn tại hay chưa
    const existingConversation = await models.Conversation.findOne({
        participants: { $all: allParticipants, $size: allParticipants.length }, // Tất cả người tham gia phải khớp
        type: type
    });

    if (existingConversation) {
        return existingConversation;
    }

    // Tạo cuộc trò chuyện mới
    const newConversation = new models.Conversation({
        participants: allParticipants,
        type: type,
        name: type === 'group' ? name : undefined // Nếu là nhóm, đặt tên; nếu là trò chuyện trực tiếp thì không cần
    });

    await newConversation.save();
    return newConversation;
};

// Hàm updateLastMessage: Cập nhật tin nhắn cuối cùng của cuộc trò chuyện
const updateLastMessage = async (conversationId, messageId) => {
    await models.Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: messageId, // Cập nhật tin nhắn cuối cùng
        updatedAt: new Date() // Cập nhật thời gian sửa đổi
    });
};

// Xuất các hàm để sử dụng ở nơi khác trong ứng dụng
export default {
    getUserConversations,
    getOrCreateDirectConversation,
    searchConversations,
    getConversationMessages,
    getConversation,
    createConversation,
    updateLastMessage,
};
