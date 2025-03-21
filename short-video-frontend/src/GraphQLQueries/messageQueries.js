import { gql } from "@apollo/client";

export const SEND_MESSAGE = gql`
    mutation SendMessage($conversationId: ID!, $content: String!, $contentType: String!) {
        sendMessage(conversationId: $conversationId, content: $content, contentType: $contentType) {
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


export const GET_MESSAGES = gql`
    query GetConversationMessages($conversationId: ID!, $page: Int, $limit: Int) {
        getConversationMessages(conversationId: $conversationId, page: $page, limit: $limit) {
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
