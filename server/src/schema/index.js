import { gql } from 'apollo-server-express';

const typeDefs = gql`
  scalar Upload
  scalar Date
  type User {
    id: ID!
    username: String!
    email: String!
    profilePicture: String
    createdAt: String!
    followerCount: Int!
    followingCount: Int!
    isFollowed: Boolean
  }

  type FollowConnection {
    edges: [FollowEdge!]!
    pageInfo: PageInfo!
  }

  type FollowEdge {
    node: User!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type Category {
    id: ID!
    name: String!
    description: String!
  }

  type Video {
    id: ID!
    user: User!
    title: String!
    videoUrl: String!
    thumbnailUrl: String
    duration: Float
    category: Category
    tags: [String!]!
    likeCount: Int!
    views: Int!
    commentsCount: Int!
    savesCount: Int!
    engagementRate: Float!
    createdAt: Date!
    isViewed: Boolean
    isLiked: Boolean
    isSaved: Boolean
    nextVideo: Video
    prevVideo: Video
  }

  type DailyVideoStatistics {
    date: Date!
    views: Int!
    likes: Int!
    comments: Int!
}

  type Comment {
    id: ID!
    content: String!
    user: User!
    video: Video!
    parentComment: Comment
    replies: [Comment!]!
    level: Int!
    createdAt: Date!
    likeCount: Int!
    isLiked: Boolean
  }

  type Like {
    id: ID!
    user: User!
    targetType: String!
    target: LikeTarget!
    createdAt: Date!
  }

  union LikeTarget = Video | Comment

  type Follow {
    id: ID!
    follower: User!
    following: User!
    createdAt: Date!
  }

  type InteractionType {
    id: ID!
    name: String!
    description: String
  }

  type UserInteraction {
    id: ID!
    user: User!
    video: Video!
    interactionType: InteractionType!
    score: Float
    timestamp: Date!
  }

  type UserPreference {
    id: ID!
    user: User!
    category: Category!
    score: Float
  }

  type Recommendation {
    id: ID!
    user: User!
    video: Video!
    isViewed: Boolean!
  }

  type Save {
    id: ID!
    user: User!
    video: Video!
    createdAt: Date!
  }

  type Conversation {
    id: ID!
    participants: [User!]!
    type: String
    name: String
    lastMessage: Message
    createdAt: Date!
    updatedAt: Date!
  }


  type Message {
    id: ID!
    conversation: Conversation!
    sender: User!
    content: String!
    contentType: String!
    readBy: [User!]!
    createdAt: Date!
  }

  type Notification {
    id: ID!
    type: String!
    content: String!
    read: Boolean!
    createdAt: Date!
    user: User!
    actor: User
    video: Video
    comment: Comment
  }

  type Query {
    getUser(id: String!): User
    verifyToken: User
    getUserVideos(id: String!, page: Int!, limit: Int!): [Video!]!
    getNextUserVideo(currentVideoCreatedAt: String!, userId: ID!): Video
    getUserFollowers(userId: ID!, first: Int, after: String): FollowConnection!
    getUserFollowing(userId: ID!, first: Int, after: String): FollowConnection!
    getVideo(id: ID!): Video
    getVideoComments(videoId: ID!, page: Int!, limit: Int!): [Comment!]!
    getComments(videoId: ID!): [Comment!]!
    getRecommendedVideos(limit: Int!): [Video!]!
    getRecommendedVideosNotLoggedIn(limit: Int!): [Video!]!
    searchVideos(keyword: String!): [Video!]!
    getCategories: [Category!]!
    getUserInteractions(userId: ID!): [UserInteraction!]!
    getUserPreferences(userId: ID!): [UserPreference!]!
    getUserConversations: [Conversation!]!
    getConversation(id: ID!): Conversation
    getConversationMessages(conversationId: ID!, page: Int, limit: Int): [Message!]!
    notifications: [Notification!]!
    getFollowingVideos(limit: Int): [Video!]!
    getFriendVideos(limit: Int): [Video!]!
    search(query: String!, page: Int, limit: Int): SearchResult!
    getVideosByCategory(categoryId: ID!, page: Int, limit: Int): [Video!]!
    getFollowersByUserId(userId: ID!): [User!]!
    getFollowingByUsername(username: String!): [User!]!
    # User Management
    getAllUsers(page: Int, limit: Int): UserPaginatedResult!
    getUsersByRegistrationDate(startDate: Date!, endDate: Date!, page: Int, limit: Int): UserPaginatedResult!
    getMostActiveUsers(limit: Int): [UserActivitySummary!]!

    # Video Management
    getAllVideos(page: Int, limit: Int): VideoPaginatedResult!
    getVideosByUploadDate(startDate: Date!, endDate: Date!, page: Int, limit: Int): VideoPaginatedResult!
    getMostViewedVideos(limit: Int): [Video!]!
    getMostLikedVideos(limit: Int): [Video!]!

    # Category Management
    getAllCategories: [Category!]!
    getCategoryStats: [CategoryStats!]!

    # Comment Management
    getAllComments(page: Int, limit: Int): CommentPaginatedResult!
    getFlaggedComments(page: Int, limit: Int): CommentPaginatedResult!

    # Platform Statistics
    getDailyActiveUsers(startDate: Date!, endDate: Date!): [DailyActiveUserStat!]!
    getVideoUploadStats(startDate: Date!, endDate: Date!): [DailyVideoUploadStat!]!
    getOverallEngagementRate(startDate: Date!, endDate: Date!): Float!

    # User Interactions
    getUserInteractionSummary(startDate: Date!, endDate: Date!): UserInteractionSummary!

    # Video Statistics
    getDailyVideoStatistics(startDate: Date!, endDate: Date!): [DailyVideoStatistics!]!
  }

  type Mutation {
    registerUser(username: String!, email: String!, password: String!, avatarFile: Upload): AuthPayload!
    loginUser(email: String!, password: String!): AuthPayload!
    updateUser(id: ID!, username: String, email: String, profilePicture: Upload): User!
    uploadVideo(title: String!, videoFile: Upload!, thumbnailFile: Upload, category: ID, tags: [String!]): Video!
    likeVideo(targetId: ID!): Boolean!
    unlikeVideo(targetId: ID!): Boolean!
    viewVideo(videoId: ID!): Boolean!
    likeComment(targetId: ID!): Boolean!
    unlikeComment(targetId: ID!): Boolean!
    followUser(followingId: ID!): Boolean!
    unfollowUser(followingId: ID!): Boolean!
    addComment(videoId: ID!, content: String!, parentCommentId: ID): Comment!
    saveVideo(videoId: ID!): Boolean!
    unsaveVideo(videoId: ID!): Boolean!
    updateUserPreference(categoryId: ID!, score: Float!): UserPreference!
    recordUserInteraction(videoId: ID!, interactionTypeId: ID!, score: Float): UserInteraction!
    createConversation(participantIds: [ID!]!, name: String): Conversation!
    sendMessage(conversationId: ID!, content: String!, contentType: String!): Message!
    markMessageAsRead(messageId: ID!): Boolean!
    getOrCreateDirectConversation(userId: String!): Conversation!
    markNotificationAsRead(notificationId: ID!): Notification!
  }

  type Subscription {
    commentAdded(videoId: ID!): Comment!
    newMessage(conversationId: ID!): Message!
    conversationUpdated(conversationId: ID!): Conversation!
    newNotification: Notification!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type SearchResult {
    users: [User!]!
    videos: [Video!]!
    totalUsers: Int!
    totalVideos: Int!
  }

  #admin
  type UserPaginatedResult {
    users: [User!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  type VideoPaginatedResult {
    videos: [Video!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  type CommentPaginatedResult {
    comments: [Comment!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  type UserActivitySummary {
    user: User!
    videoCount: Int!
    commentCount: Int!
    likeCount: Int!
    viewCount: Int!
  }

  type CategoryStats {
    category: Category!
    videoCount: Int!
    totalViews: Int!
    averageEngagementRate: Float!
  }

  type DailyActiveUserStat {
    date: Date!
    activeUsers: Int!
  }

  type DailyVideoUploadStat {
    date: Date!
    uploadCount: Int!
  }

  type UserInteractionSummary {
    totalLikes: Int!
    totalComments: Int!
    totalViews: Int!
    totalSaves: Int!
    averageEngagementRate: Float!
  }
`;

export default typeDefs;
