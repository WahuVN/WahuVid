import models from "../models/index.js"


const getUserConversations = async (userId) => {
    return await models.Conversation.find({
        participants: userId
    }).sort({
        updatedAt: -1
    });
};

const getOrCreateDirectConversation = async (userId1, userId2) => {
    const sortedParticipants = [userId1, userId2].sort().join(',');
    let conversation = await models.Conversation.findOne({
        type: 'direct',
        sortedParticipants: sortedParticipants
    });


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

const searchConversations = async (userId, searchTerm) => {
    return await models.Conversation.find({
        participants: userId,
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { type: 'direct' }
        ]
    });
};

const getConversationMessages = async (conversationId, limit = 50, skip = 0) => {
    return await models.Message.find({ conversation: conversationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};



const getConversation = async (conversationId, userId) => {
    const conversation = await models.Conversation.findById(conversationId);

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    // if (!conversation.participants.some(p => p._id.toString() === userId)) {
    //     throw new Error('You are not a participant of this conversation');
    // }

    return conversation;
};

const createConversation = async (creatorId, participantIds, type, name) => {
    console.log(creatorId, participantIds, "________123__________________");
    const allParticipants = [...new Set([creatorId, ...participantIds])];

    if (type === 'direct' && allParticipants.length !== 2) {
        throw new Error('Direct conversations must have exactly 2 participants');
    }

    const existingConversation = await models.Conversation.findOne({
        participants: { $all: allParticipants, $size: allParticipants.length },
        type: type
    });

    if (existingConversation) {
        return existingConversation;
    }

    const newConversation = new models.Conversation({
        participants: allParticipants,
        type: type,
        name: type === 'group' ? name : undefined
    });

    await newConversation.save();
    return newConversation;
};

const updateLastMessage = async (conversationId, messageId) => {
    await models.Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: messageId,
        updatedAt: new Date()
    });
};

export default {
    getUserConversations,
    getOrCreateDirectConversation,
    searchConversations,
    getConversationMessages,
    getConversation,
    createConversation,
    updateLastMessage,
};
