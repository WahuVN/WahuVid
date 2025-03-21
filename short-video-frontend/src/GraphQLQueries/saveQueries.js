import { gql } from "@apollo/client";

export const SAVE_VIDEO = gql`
  mutation SaveVideo($videoId: ID!) {
    saveVideo(videoId: $videoId)
  }
`;

export const UNSAVE_VIDEO = gql`
  mutation UnsaveVideo($videoId: ID!) {
    unsaveVideo(videoId: $videoId)
  }
`;
