import { gql } from "@apollo/client";

export const SEARCH_QUERY = gql`
  query Search($query: String!, $page: Int!, $limit: Int!) {
    search(query: $query, page: $page, limit: $limit) {
      users {
        id
        username
        profilePicture
        followerCount
      }
      videos {
        id
        title
        views
        likeCount
        isViewed
        videoUrl
        thumbnailUrl
        tags
        user {
          username
          followerCount
          profilePicture
        }
      }
      totalUsers
      totalVideos
    }
  }
`;


export const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!, $authorId: ID!, $postType: String, $file: Upload) {
    createPost(title: $title, content: $content, authorId: $authorId, postType: $postType, file: $file) {
      id
      title
      content
      author {
        id
        name
      }
      ... on ImagePost {
        image
      }
      ... on VideoPost {
        video
      }
    }
  }
`;

