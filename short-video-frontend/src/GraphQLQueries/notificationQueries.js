import { gql } from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications {
      id
      type
      content
      read
      createdAt
      actor {
        id
        username
        profilePicture
      }
      video {
        id
        title
        user {
            username
        }
      }
      comment {
        id
        content
      }
      user {
        username
      }
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) {
      id
      read
    }
  }
`;

export const NEW_NOTIFICATION_SUBSCRIPTION = gql`
  subscription NewNotification {
    newNotification {
      id
      type
      content
      read
      createdAt
      actor {
        id
        username
        profilePicture
      }
      video {
        id
        title
        user {
            username
        }
      }
      comment {
        id
        content
      }
      user {
        username
      }
    }
  }
`;
