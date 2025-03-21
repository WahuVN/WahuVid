import { gql } from "@apollo/client";

export const VERIFY_TOKEN = gql`
  query VerifyToken {
    verifyToken {
      id
      username
      email
      profilePicture
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUser($userId: String!) {
      getUser(id: $userId) {
          id
          username
          email
          profilePicture
          followerCount
          followingCount
          isFollowed
      }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($username: String!, $email: String!, $password: String!, $avatarFile: Upload) {
    registerUser(username: $username, email: $email, password: $password, avatarFile: $avatarFile) {
      token
      user {
        id
        username
        email
        profilePicture
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      token
      user {
        id
        username
        email
        profilePicture
      }
    }
  }
`;
