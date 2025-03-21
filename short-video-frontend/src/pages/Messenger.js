import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import { Card, CardContent, Divider, Grid, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, TextField, Button, Box, CircularProgress, useTheme, ListItemButton } from "@mui/material";
import { useParams } from "react-router-dom";
import { START_CONVERSATION, GET_CONVERSATIONS, NEW_MESSAGE_ADDED } from "../GraphQLQueries/conversationQueries";
import { SEND_MESSAGE, GET_MESSAGES } from "../GraphQLQueries/messageQueries";
import { Send } from 'lucide-react';
import UserContext from '../contexts/userContext';

const Messenger = () => {
    const { username } = useParams();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [isStartingConversation, setIsStartingConversation] = useState(false);
    const [messages, setMessages] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [conversations, setConversations] = useState([]);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const theme = useTheme();

    const { user } = useContext(UserContext);

    const [getOrCreateDirectConversation] = useMutation(START_CONVERSATION);
    const [sendMessage] = useMutation(SEND_MESSAGE);

    const { data: conversationsData, loading: conversationsLoading, refetch: refetchConversations } = useQuery(GET_CONVERSATIONS);
    const { data: messagesData, loading: messagesLoading, fetchMore, refetch: refetchMessages } = useQuery(GET_MESSAGES, {
        variables: { conversationId: selectedConversation, page: page, limit: 20 },
        skip: !selectedConversation,
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if(conversationsData && conversationsData.getUserConversations){
            setConversations(conversationsData.getUserConversations);
        }
    }, [conversationsData]);


    const { data: newMessageData } = useSubscription(NEW_MESSAGE_ADDED, {
        variables: {
            conversationId: selectedConversation
        }
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = scrollPosition;
        }
    }, [scrollPosition]);

    const handleConversationSelect = (conversationId) => {
        console.log(selectedConversation);
        setPage(1);
        setSelectedConversation(conversationId);
    };

    useEffect(() => {
        if (messagesData?.getConversationMessages && page === 1) {
            const newMessages = [...messagesData.getConversationMessages].reverse();
            setMessages(prevMessages => [...newMessages, ...prevMessages]);
            setHasMore(messagesData.getConversationMessages.length >= 20);
            if (page === 1) scrollToBottom();
        }
    }, [messagesData, page]);

    useEffect(() => {
        if (newMessageData && newMessageData.newMessage) {
            setMessages(prevMessages => [...prevMessages, newMessageData.newMessage]);

            scrollToBottom();
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv.id === selectedConversation) {
                        return {
                            ...conv,
                            lastMessage: newMessageData.newMessage
                        };
                    }
                    return conv;
                });
            });

            // If the new message is not from the current user, refetch conversations to update unread count
            if (newMessageData.newMessage.sender.username !== user.username) {
                refetchConversations();
            }
        }
    }, [newMessageData, selectedConversation, user.username, refetchConversations]);

    useEffect(() => {
        if (selectedConversation) {
            setMessages([]);
            setPage(1);
            setHasMore(true);
            refetchMessages();
        }
    }, [selectedConversation]);

    const handleScroll = useCallback(() => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            if (scrollHeight + scrollTop < clientHeight + 100 && hasMore && !isLoadingMore) {
                console.log(page, selectedConversation);
                loadMoreMessages();
            }
        }
    }, [hasMore, isLoadingMore, selectedConversation]);

    const loadMoreMessages = async () => {
        if (!hasMore || isLoadingMore || !selectedConversation) return;
        setIsLoadingMore(true);
        setScrollPosition(messagesContainerRef.current.scrollTop);
        try {
            const result = await fetchMore({
                variables: {
                    conversationId: selectedConversation,
                    page: page + 1,
                    limit: 20
                },
            });
            if (result.data.getConversationMessages.length > 0) {
                const newMessages = result.data.getConversationMessages.reverse();
                setMessages(pre => [...newMessages, ...pre]);
                setPage(page + 1);
                setHasMore(result.data.getConversationMessages.length === 20);

            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more messages:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const startConversation = useCallback(async (participantUsername) => {
        if (isStartingConversation) return;
        setIsStartingConversation(true);
        try {
            const existingConversation = conversationsData?.getUserConversations.find(
                conv => conv.participants.some(part => part.username === participantUsername)
            );

            if (existingConversation) {
                setSelectedConversation(existingConversation.id);
            } else {
                const { data } = await getOrCreateDirectConversation({
                    variables: { userId: participantUsername }
                });
                setSelectedConversation(data.getOrCreateDirectConversation.id);
                await refetchConversations();
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
        } finally {
            setIsStartingConversation(false);
        }
    }, [getOrCreateDirectConversation, conversationsData, refetchConversations]);

    useEffect(() => {
        if (username && !isStartingConversation && user.username !== username) {
            startConversation(username);
        }
    }, [username, startConversation, isStartingConversation]);

    const handleSendMessage = async () => {
        if (messageInput.trim() && selectedConversation) {
            try {
                await sendMessage({
                    variables: {
                        conversationId: selectedConversation,
                        content: messageInput,
                        contentType: 'text',
                    }
                });
                setMessageInput('');
            } catch (error) {
                console.error("Error sending message:", error);
            }
        }
    };

    const renderMessage = (message, i) => {
        const isOwnMessage = message.sender.username === user.username;
        return (
            <Box
                key={message.id}
                sx={{
                    display: 'flex',
                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                    mb: 1,
                }}
            >
                <Box
                    sx={{
                        maxWidth: '70%',
                        minWidth: '100px',
                        backgroundColor: isOwnMessage ? '#DCF8C6' : '#E8E8E8',
                        borderRadius: '10px',
                        px: 1,
                        pt: 1,
                        pb: 3,
                        position: 'relative',
                    }}
                >
                    {!isOwnMessage && (
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {message.sender.username}
                        </Typography>
                    )}
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography variant="caption" sx={{ position: 'absolute', right: 8, bottom: 4, color: 'text.secondary' }}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </Box>
            </Box>
        );
    };

    return (
        <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '90vh' }}>
                    <Typography variant="h6" sx={{ m: 1 }}>Messenger</Typography>
                    <Divider />
                    <CardContent>
                        <List>
                            {conversationsLoading ? (
                                <Typography>Đang tải...</Typography>
                            ) : (
                                conversations.map((conversation) => (
                                    <ListItemButton
                                        key={conversation.id}
                                        button
                                        onClick={() => handleConversationSelect(conversation.id)}
                                        selected={selectedConversation === conversation.id}
                                        sx={{
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={conversation?.participants[0]?.username === user.username ? conversation?.participants[1]?.profilePicture : conversation?.participants[0]?.profilePicture} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={conversation?.name ? conversation?.name : conversation?.participants[0]?.username === user.username ? conversation?.participants[1]?.username : conversation?.participants[0]?.username}
                                            secondary={`${conversation?.lastMessage?.content}  - lúc  ${new Date(conversation?.lastMessage?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        />
                                    </ListItemButton>
                                ))
                            )}
                        </List>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={8}>
                <Card sx={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <CardContent
                        ref={messagesContainerRef}
                        sx={{
                            flexGrow: 1,
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column-reverse',
                            '&::-webkit-scrollbar': {
                                width: '6px',
                                backgroundColor: 'transparent',
                            },
                            '&::-webkit-scrollbar-track': {
                                backgroundColor: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                borderRadius: '3px',
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                },
                            },
                        }}
                        onScroll={handleScroll}
                    >
                        <div>
                            {isLoadingMore && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}
                            {messagesLoading && page === 1 ? (
                                <Typography>Đang tải tin nhắn...</Typography>
                            ) : (
                                messages.map((m, i) => renderMessage(m, i))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </CardContent>
                    <Divider />
                    <Box sx={{ p: 0.5, display: 'flex' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Nhập tin nhắn..."
                            size='small'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyUp={(e) => e.key === 'Enter' && handleSendMessage()}
                            sx={{ mr: 1, p: 0 }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSendMessage}
                        >
                            <Send />
                        </Button>
                    </Box>
                </Card>
            </Grid>
        </Grid>
    );
};

export default React.memo(Messenger);
