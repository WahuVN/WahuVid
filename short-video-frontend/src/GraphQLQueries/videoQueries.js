import { gql } from "@apollo/client";

export const UPLOAD_VIDEO = gql`
  mutation UploadVideo($title: String!, $videoFile: Upload!, $thumbnailFile: Upload, $category: ID, $tags: [String!]) {
    uploadVideo(title: $title, videoFile: $videoFile, thumbnailFile: $thumbnailFile, category: $category, tags: $tags) {
      id
      user {
        username
      }
    }
  }
`;

export const GET_USER_VIDEO = gql`
  query GetUserVideos($id: String!, $page: Int!, $limit: Int!) {
    getUserVideos(id: $id, page: $page, limit: $limit) {
        id
        thumbnailUrl
        views
        videoUrl
        likeCount
        isViewed
    }
  }
`;

export const GET_VIDEO_DETAILS = gql`
  query GetVideoDetails($id: ID!) {
    getVideo(id: $id) {
      id
      title
      videoUrl
      thumbnailUrl
      duration
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      isViewed
      isLiked
      isSaved
      prevVideo {
        id
      }
      nextVideo {
        id
      }
      user {
        id
        username
        profilePicture
        isFollowed
      }
    }
  }
`;

export const GET_RECOMMENDED_VIDEOS = gql`
  query GetFollowingVideos($limit: Int!) {
    getFollowingVideos(limit: $limit) {
      id
      title
      videoUrl
      thumbnailUrl
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      isViewed
      isLiked
      isSaved
      user {
        id
        username
        profilePicture
        isFollowed
        followerCount
      }
    }
  }
`;

//
//
//getRecommendedVideosNotLoggedIn(limit: Int!): [Video!]!

export const GET_RECOMMENDED_VIDEOS_NOT_LOGGED_IN = gql`
  query GetRecommendedVideosNotLoggedIn($limit: Int!) {
    getRecommendedVideosNotLoggedIn(limit: $limit) {
      id
      title
      videoUrl
      thumbnailUrl
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      user {
        id
        username
        profilePicture
        followerCount
      }
    }
  }
`;

export const GET_FOLLOWING_VIDEOS = gql`
  query GetRecommendedVideos($limit: Int!) {
    getRecommendedVideos(limit: $limit) {
      id
      title
      videoUrl
      thumbnailUrl
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      isViewed
      isLiked
      isSaved
      user {
        id
        username
        profilePicture
        isFollowed
        followerCount
      }
    }
  }
`;

export const GET_FRIEND_VIDEOS = gql`
  query GetFriendVideos($limit: Int!) {
    getFriendVideos(limit: $limit) {
      id
      title
      videoUrl
      thumbnailUrl
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      isViewed
      isLiked
      isSaved
      user {
        id
        username
        profilePicture
        isFollowed
        followerCount
      }
    }
  }
`;

export const GET_VIDEOS_BY_CATEGORY = gql`
  query GetVideosByCategory($categoryId: ID!, $page: Int!, $limit: Int!) {
    getVideosByCategory(categoryId: $categoryId, page: $page, limit: $limit) {
      id
      title
      videoUrl
      thumbnailUrl
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      isViewed
      isLiked
      isSaved
      user {
        id
        username
        profilePicture
        isFollowed
        followerCount
      }
    }
  }
`;

