import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import models from '../models/index.js';
import userService from '../services/userService.js';
import videoService from '../services/videoService.js';
import likeService from '../services/likeService.js';
import commentService from '../services/commentService.js';
import followService from '../services/followService.js';
import categoryService from '../services/categoryService.js';
import saveService from '../services/saveService.js';
import viewService from '../services/viewService.js';
import pubsub from './pubsub.js';
import messageService from '../services/messageService.js';
import conversationService from '../services/conversationService.js';
import notificationService from '../services/notificationService.js';
import searchService from '../services/searchService.js';
import statisticsService from '../services/statisticService.js';


const resolvers = {
    Upload: GraphQLUpload,
    Query: {
        getUser: async (_, { id }, { user }) => {
            return userService.getUser(id, user.id);
        },
        verifyToken: async (_, __, context) => {
            if (!context.user) {
                throw new Error('Token expired!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return userService.getUser(context.user.id, context.user.id);
        },
        getUserVideos: async (_, { id, page, limit }, { user }) => {
            return videoService.getUserVideos(id, page, limit);
        },
        getNextUserVideo: async (_, { currentVideoCreatedAt, userId }) => {
            const createdAt = new Date(currentVideoCreatedAt);
            return videoService.getNextUserVideo(createdAt, userId);
        },
        getVideo: async (_, { id }) => {
            return videoService.getVideo(id);
        },
        getRecommendedVideos: async (_, { limit }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to get recommended videos');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return videoService.getRecommendedVideos(context.user.id, limit);
        },
        getRecommendedVideosNotLoggedIn: async (_, { limit }) => {
            return videoService.getRecommendedVideosNotLoggedIn(limit);
        },
        getFollowingVideos: async (_, { limit }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to get following videos');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return videoService.getFollowingVideos(context.user.id, limit);
        },
        getFriendVideos: async (_, { limit }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to get following videos');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            console.log('getFriendVideos_________________________' + context.user.id)
            return videoService.getFriendVideos(context.user.id, limit);
        },
        getCategories: async (_, __, { user, tokenError }) => {
            if (tokenError) {
                throw new Error(tokenError);
            }
            if (!user) {
                throw new Error('Không được phép truy cập');
            }
            return categoryService.getCategories();
        },
        getVideoComments: async (_, { videoId, page, limit }, context) => {
            return commentService.getVideoComments(videoId, page, limit);
        },
        getUserConversations: async (_, __, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to get conversations');
            return conversationService.getUserConversations(user.id);
        },
        getConversation: async (_, { id }, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to get a conversation');
            return conversationService.getConversation(id, user.id);
        },
        getConversationMessages: async (_, { conversationId, page, limit }, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to get messages');
            return messageService.getConversationMessages(conversationId, user.id, page, limit);
        },
        notifications: async (_, __, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to get notifications');
            return notificationService.getUserNotifications(user.id);
        },
        search: async (_, { query, page, limit }) => {
            return searchService.search(query, page, limit);
        },
        getVideosByCategory: async (_, { categoryId, page, limit }) => {
            return videoService.getVideosByCategory(categoryId, page, limit);
        },
        getDailyVideoStatistics: async (_, { startDate, endDate }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to view daily video statistics');
            }
            return statisticsService.getDailyVideoStatistics(context.user.id, startDate, endDate);
        },
    },
    Mutation: {
        registerUser: async (_, { username, email, password, avatarFile }) => {
            return userService.registerUser(username, email, password, avatarFile);
        },
        loginUser: async (_, { email, password }) => {
            return userService.loginUser(email, password);
        },
        uploadVideo: async (_, { title, videoFile, thumbnailFile, category, tags }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to upload a video');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            const video = await videoService.uploadVideo(context.user.id, title, videoFile, thumbnailFile, category, tags);
            if (video) {
                const followers = await userService.getFollowers(context.user.id);

                for (const follower of followers) {
                    const { notification, user } = await notificationService.createVideoUploadNotification(video, context.user.id, follower.follower.toString());

                    if (notification) {
                        pubsub.publish(`NEW_NOTIFICATION_${follower.follower.toString()}`, {
                            newNotification: notification
                        });
                    }
                }
            }
            return video;
        },
        likeVideo: async (_, { targetId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to like a video');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            const res = likeService.likeVideo(targetId, context.user.id);
            if (res) {
                const t = await notificationService.createLikeNotification(targetId, context.user);
                if (t?.user && t?.notification)
                    pubsub.publish(`NEW_NOTIFICATION_${t.user}`, {
                        newNotification: t.notification
                    });
            }
            return res;
        },
        unlikeVideo: async (_, { targetId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to like a video');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return likeService.unlikeVideo(targetId, context.user.id);
        },
        viewVideo: async (_, { videoId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to like a video');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return viewService.viewVideo(context.user.id, videoId);
        },
        likeComment: async (_, { targetId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to like comment');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            const res = likeService.likeComment(context.user.id, targetId);
            if (res) {
                const { notification, user } = await notificationService.createLikeCommentNotification(targetId, context.user);
                pubsub.publish(`NEW_NOTIFICATION_${user}`, {
                    newNotification: notification
                });
            }
            return res;
        },
        unlikeComment: async (_, { targetId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to unlike comment');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return likeService.unlikeComment(context.user.id, targetId);
        },
        addComment: async (_, { videoId, content, parentCommentId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to comment on video');
            }
            if (context.tokenError) {
                throw new Error(context.tokenError);
            }
            let newComment = await commentService.addComment(videoId, content, parentCommentId, context.user.id);

            newComment = {
                ...newComment.toObject(),
                id: newComment._id,
                replies: [],
            };

            pubsub.publish(`COMMENT_ADDED_${videoId}`, {
                commentAdded: newComment,
                videoId
            });

            const { notification, user, notification2, user2 } = await notificationService.createVideoCommentNotification(videoId, parentCommentId, context.user.id);
            if (notification && user) {
                pubsub.publish(`NEW_NOTIFICATION_${user}`, {
                    newNotification: notification
                });
            }
            if (notification2 && user2) {
                pubsub.publish(`NEW_NOTIFICATION_${user2}`, {
                    newNotification: notification2
                });
            }

            return newComment;
        },
        followUser: async (_, { followingId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to follow this user!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            const res = followService.followUser(context.user.id, followingId);
            if (res) {
                const { notification, user } = await notificationService.createNewFollowerNotification(context.user.id, followingId);
                if (notification) {
                    pubsub.publish(`NEW_NOTIFICATION_${user}`, {
                        newNotification: notification
                    })
                }
            }
            return res;
        },
        unfollowUser: async (_, { followingId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to unfollow this user!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return followService.unfollowUser(context.user.id, followingId);
        },
        saveVideo: async (_, { videoId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to save this video!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return saveService.saveVideo(context.user.id, videoId);
        },
        unsaveVideo: async (_, { videoId }, context) => {
            if (!context.user) {
                throw new Error('You must be logged in to unsave this video!');
            }
            if (context.tokenError) {
                throw new Error(tokenError);
            }
            return saveService.unsaveVideo(context.user.id, videoId);
        },
        createConversation: async (_, { participantIds, type, name }, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to create a conversation');
            return conversationService.createConversation(user.id, participantIds, type, name);
        },
        sendMessage: async (_, { conversationId, content, contentType }, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to send a message');
            const message = await messageService.sendMessage(user.id, conversationId, content, contentType);
            pubsub.publish(`NEW_MESSAGE_${conversationId}`, { newMessage: message, conversationId });
            return message;
        },
        markMessageAsRead: async (_, { messageId }, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to mark a message as read');
            return messageService.markMessageAsRead(messageId, user.id);
        },
        getOrCreateDirectConversation: async (_, { userId }, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to create a conversation');
            const u = await userService.getUser(userId);
            return conversationService.getOrCreateDirectConversation(user.id, u._id);
        },
        markNotificationAsRead: async (_, { notificationId }, { user, tokenError }) => {
            if (tokenError) throw new Error(tokenError);
            if (!user) throw new Error('You must be logged in to mark this notification as read');
            return notificationService.markNotificationAsRead(notificationId, user.id);
        },
    },
    User: {
        isFollowed: async (parent, _, context) => {
            if (!context.user) {
                return false;
            }
            const follower = await models.Follow.findOne({
                follower: context.user.id,
                following: parent._id
            });
            return !!follower;
        }
    },
    Video: {
        user: async (parent, _) => {
            return await models.User.findById(parent.user);
        },
        isViewed: async (parent, _, context) => {
            if (!context.user) {
                return false;
            }
            return videoService.isViewed(context.user.id, parent._id)
        },
        isLiked: async (parent, _, context) => {
            if (!context.user) {
                return false;
            }
            return videoService.isLiked(context.user.id, parent._id);
        },
        isSaved: async (parent, _, context) => {
            if (!context.user) {
                return false;
            }
            return videoService.isSaved(context.user.id, parent._id);
        },
        category: async (parent, _) => {
            return categoryService.getCategory(parent.category);
        },
        nextVideo: async (parent, _) => {
            return videoService.getNextUserVideo(parent.createdAt, parent.user._id);
        },
        prevVideo: async (parent, _) => {
            return videoService.getPrevUserVideo(parent.createdAt, parent.user._id);
        },
    },
    Comment: {
        replies: (parent, _) => {
            return commentService.getChildrenComments(parent._id);
        },
        user: async (parent, _) => {
            return userService.getUser(parent.userId);
        },
        parentComment: async (parent, _) => {
            return commentService.getComment(parent.parentCommentId);
        },
        isLiked: async (parent, _, context) => {
            return commentService.isLiked(context.user.id, parent._id);
        },
    },
    Conversation: {
        participants: async (parent, _, { user }) => {
            return userService.getUsersByIds(parent.participants);
        },
        lastMessage: async (parent, _, { user }) => {
            return messageService.getLastMessage(parent.id);
        },
    },
    Message: {
        sender: async (parent, _, { user }) => {
            return userService.getUser(parent.sender);
        },
        readBy: async (parent, _, { user }) => {
            return userService.getUsersByIds(parent.readBy);
        },
    },
    Notification: {
        user: async (parent, _) => {
            return userService.getUser(parent.user);
        },
        actor: async (parent, _) => {
            return userService.getUser(parent.actor);
        },
        video: async (parent, _) => {
            return videoService.getVideo(parent.video);
        },
        comment: async (parent, _) => {
            return commentService.getComment(parent.comment);
        },
    },
    Subscription: {
        commentAdded: {
            subscribe: (_, { videoId }, context) => {
                console.log('Subscription ' + videoId);
                return pubsub.asyncIterator(`COMMENT_ADDED_${videoId}`);
            },
        },
        newMessage: {
            subscribe: (_, { conversationId }, context) => {
                return pubsub.asyncIterator(`NEW_MESSAGE_${conversationId}`);
            },
        },
        conversationUpdated: {
            subscribe: (_, { conversationId }, context) => {
                return pubsub.asyncIterator(`CONVERSATION_UPDATED_${conversationId}`);
            },
        },
        newNotification: {
            subscribe: (_, __, { user, tokenError }) => {
                if (!user) throw new Error("Authentication required");
                return pubsub.asyncIterator(`NEW_NOTIFICATION_${user.id}`);
            },
        },
    },
};

export default resolvers;
