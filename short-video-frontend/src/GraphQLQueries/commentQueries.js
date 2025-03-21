import { gql } from "@apollo/client";

export const GET_VIDEO_COMMENTS = gql`
query GetVideoComments($videoId: ID!, $page: Int!, $limit: Int!) {
  getVideoComments(videoId: $videoId, page: $page, limit: $limit) {
    id
    content
    user {
      id
      username
      profilePicture
    }
    level
    createdAt
    likeCount
    isLiked
    replies {
      id
      content
      user {
        id
        username
        profilePicture
      }
      level
      createdAt
      likeCount
      isLiked
    }
  }
}
`;

export const ADD_COMMENT = gql`
mutation AddComment($videoId: ID!, $content: String!, $parentCommentId: ID) {
  addComment(videoId: $videoId, content: $content, parentCommentId: $parentCommentId) {
    id
    content
    user {
      id
      username
      profilePicture
    }
    level
    createdAt
    likeCount
    isLiked
  }
}
`;

export const COMMENT_ADDED_SUBSCRIPTION = gql`
  subscription OnCommentAdded($videoId: ID!) {
    commentAdded(videoId: $videoId) {
      id
      content
      user {
        id
        username
        profilePicture
      }
      createdAt
      likeCount
      level
      isLiked
      parentComment {
        id
      }
    }
  }
`;
