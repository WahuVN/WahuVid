import { gql } from "@apollo/client";

export const LIKE_VIDEO = gql`
  mutation LikeVideo($targetId: ID!) {
    likeVideo(targetId: $targetId)
  }
`;

export const UNLIKE_VIDEO = gql`
  mutation UnlikeVideo($targetId: ID!) {
    unlikeVideo(targetId: $targetId)
  }
`;

export const LIKE_COMMENT = gql`
  mutation LikeComment($targetId: ID!) {
    likeComment(targetId: $targetId)
  }
`;

export const UNLIKE_COMMENT = gql`
  mutation UnlikeComment($targetId: ID!) {
    unlikeComment(targetId: $targetId)
  }
`;
