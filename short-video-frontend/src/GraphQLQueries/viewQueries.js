import { gql } from "@apollo/client";

export const VIEW_VIDEO = gql`
  mutation ViewVideo($videoId: ID!, $viewCount: Int!) {
    viewVideo(videoId: $videoId, viewCount: $viewCount)
  }
`;

export const GET_NEXT_USER_VIDEO = gql`
  mutation GetNextUserVideo($currentVideoCreatedAt: String!, $userId: ID!) {
    getNextUserVideo(currentVideoCreatedAt: $currentVideoCreatedAt, userId: $userId)
  }
`;
