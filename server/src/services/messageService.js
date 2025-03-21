import models from '../models/index.js';
import conversationService from './conversationService.js';

const getConversationMessages = async (conversationId, userId, page, limit = 50 ) => {
    const conversation = await models.Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
        throw new Error('You are not a participant of this conversation');
    }


    const res = await models.Message.find({ conversation: conversationId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    return res;
}

const sendMessage = async (senderId, conversationId, content, contentType) => {
    const conversation = await models.Conversation.findById(conversationId);
    if (!conversation) {
        throw new Error('Conversation not found');
    }

    if (!conversation.participants.includes(senderId)) {
        throw new Error('You are not a participant of this conversation');
    }

    const newMessage = new models.Message({
        conversation: conversationId,
        sender: senderId,
        content: content,
        contentType: contentType,
        readBy: [senderId]
    });

    await newMessage.save();
    await conversationService.updateLastMessage(conversationId, newMessage._id);

    return newMessage;
};

const markMessageAsRead = async (messageId, userId) => {
    const message = await models.Message.findById(messageId);
    if (!message) {
        throw new Error('Message not found');
    }

    const conversation = await models.Conversation.findById(message.conversation);
    if (!conversation.participants.includes(userId)) {
        throw new Error('You are not a participant of this conversation');
    }

    if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        await message.save();
    }

    return true;
};

const getLastMessage = async (conversationId) => {
    return await models.Message.findOne({ conversation: conversationId })
        .sort({ createdAt: -1 });
};

export default {
    getConversationMessages,
    sendMessage,
    markMessageAsRead,
    getLastMessage,
};
