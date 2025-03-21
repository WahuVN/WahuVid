import { gql } from "@apollo/client";


export const START_CONVERSATION = gql`
    mutation GetOrCreateDirectConversation($userId: String!) {
        getOrCreateDirectConversation(userId: $userId) {
            participants {
                id
                username
                email
                profilePicture
            }
            lastMessage {
                sender {
                    username
                }
                content
                contentType
                createdAt
            }
            createdAt
        }
    }
`;

export const GET_CONVERSATIONS = gql`
    query GetUserConversations {
        getUserConversations {
            id
            participants {
                id
                username
                email
                profilePicture
            }
            lastMessage {
                sender {
                    username
                }
                content
                contentType
                createdAt
            }
            createdAt
        }
    }
`;

export const NEW_MESSAGE_ADDED = gql`
    subscription NewMessage($conversationId: ID!) {
        newMessage(conversationId: $conversationId) {
            id
            sender {
                id
                username
                email
                profilePicture
            }
            content
            contentType
            createdAt
        }
    }
`;
