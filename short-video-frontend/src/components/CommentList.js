import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Comment from "./Comment";
import { Box, Card, CardContent, CircularProgress, debounce, Divider, IconButton, Typography } from "@mui/material";
import { ADD_COMMENT, COMMENT_ADDED_SUBSCRIPTION, GET_VIDEO_COMMENTS } from "../GraphQLQueries/commentQueries";
import { useMutation, useQuery, useSubscription } from "@apollo/client";
import UserContext from "../contexts/userContext";
import CommentInput from "./CommentInput";
import { X } from "lucide-react";

const CommentList = ({ videoId, showCommentVideoId, setShowComments, isDetails = false }) => {
    const [expandedComments, setExpandedComments] = useState({});
    const [hasMore, setHasMore] = useState(true);
    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [replyingTo, setReplyingTo] = useState(null);

    const { user } = useContext(UserContext);

    const commentsContainerRef = useRef();

    const { data: commentsData, loading: commentsLoading, error: commentsError, fetchMore } = useQuery(GET_VIDEO_COMMENTS, {
        variables: { videoId: videoId, page: 1, limit: 10 },
    });

    const { data: subscriptionData } = useSubscription(COMMENT_ADDED_SUBSCRIPTION, {
        variables: { videoId: videoId },
        onError: (error) => {
          console.error('Subscription error:', error);
        },
    });

    useEffect(() => {
        if (subscriptionData && subscriptionData.commentAdded) {
            const newComment = subscriptionData.commentAdded;
            console.log(subscriptionData.commentAdded);
            if (newComment.user.username !== user.username) {
                setComments(prevComments => {
                    if (newComment.level === 0) {
                        return [newComment, ...prevComments];
                    } else {
                        return prevComments.map(comment => {
                            if (comment.id === newComment.parentComment.id) {
                                return {
                                    ...comment,
                                    replies: [
                                        ...comment.replies,
                                        newComment
                                    ]
                                };
                            }
                            return comment;
                        });
                    }
                });
                // setLocalCommentsCount(prevCount => prevCount + 1);
            }
        }
    }, [subscriptionData]);

    const handleReply = (commentId) => {
        setReplyingTo(commentId);
    };

    const loadMoreComments = useCallback(debounce(() => {
        if (!hasMore || commentsLoading) return;

        fetchMore({
            variables: {
                videoId: videoId,
                page: page + 1,
                limit: 10
            },
        }).then((fetchMoreResult) => {
            const newComments = fetchMoreResult.data.getVideoComments;
            if (newComments.length > 0) {
                setComments(pre => [...pre, ...newComments]);
                setPage(page + 1);
                setHasMore(newComments.length === 10);
            } else {
                setHasMore(false);
            }
        });
    }, 200), [fetchMore, hasMore, commentsLoading, videoId, page]);

    useEffect(() => {
        if (commentsData?.getVideoComments) {
            setComments(commentsData.getVideoComments);
            setHasMore(commentsData.getVideoComments.length === 10);
        }
    }, [commentsData])

    const handleAddComment = async (commentContent) => {
        if (commentContent.trim() === '') return;

        try {
            await addComment({
                variables: {
                    videoId: videoId,
                    content: commentContent,
                    parentCommentId: replyingTo,
                },
            });
            setReplyingTo(null);
            // setLocalCommentsCount(prevCount => prevCount + 1);
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    const handleScroll = useCallback(() => {
        if (commentsContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 5) {
                loadMoreComments();
            }
        }
    }, [loadMoreComments]);
    useEffect(() => {
        const currentRef = commentsContainerRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (currentRef) {
                currentRef.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);


    const [addComment] = useMutation(ADD_COMMENT, {
        update(cache, { data: { addComment } }) {
            const existingComments = cache.readQuery({
                query: GET_VIDEO_COMMENTS,
                variables: { videoId: videoId, page: 1, limit: 10 },
            });

            if (existingComments) {
                const newComment = {
                    ...addComment,
                    replies: addComment.replies || [],
                };

                const updatedComments = replyingTo
                    ? existingComments.getVideoComments.map(comment =>
                        comment.id === replyingTo
                            ? {
                                ...comment,
                                replies: [...(comment.replies || []), newComment]
                            }
                            : comment
                    )
                    : [newComment, ...existingComments.getVideoComments];

                const commentsWithReplies = updatedComments.map(comment => ({
                    ...comment,
                    replies: comment.replies || [],
                }));

                cache.writeQuery({
                    query: GET_VIDEO_COMMENTS,
                    variables: { videoId: videoId, page: 1, limit: 10 },
                    data: { getVideoComments: commentsWithReplies },
                });
            }
        },
    });

    const toggleCommentExpansion = (commentId) => {
        setExpandedComments(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    return (
        <Card
            sx={{
                zIndex: 1,
                mt: 2,
                height: `${isDetails ? '68.3vh' : '90vh'}`,
                position: 'relative',
            }}>
            <Typography variant="h6" sx={{ m: 1 }}>Bình luận</Typography>
            {showCommentVideoId && (
                <IconButton
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                    }}
                    onClick={() => {
                        showCommentVideoId(null);
                        setShowComments(false);
                    }}
                >
                    <X />
                </IconButton>
            )}
            <Divider />
            <CardContent
                sx={{
                    pt: 0,
                    pb: 4
                }}
            >
                <Box
                    ref={commentsContainerRef}
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        height: `${isDetails ? '57.5vh' : '79vh'}`,
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
                >
                    {comments.map(comment => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            handleReply={handleReply}
                            toggleCommentExpansion={toggleCommentExpansion}
                            expandedComments={expandedComments}
                        />
                    ))}
                    {commentsLoading && (
                        <Box display="flex" justifyContent="center" my={2}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    {!hasMore && (
                        <Typography variant="body2" textAlign="center" my={2}>
                            {comments.length === 0 ? 'Hãy là người đầu tiên bình luận' : 'Đã tải hết bình luận'}
                        </Typography>
                    )}
                </Box>
            </CardContent>
            <Box sx={{ position: 'absolute', bottom: 0, right: 0, left: 0 }}>
                <CommentInput replyingTo={replyingTo} handleSubmit={handleAddComment} onCloseClick={() => { setReplyingTo(null) }} />
            </Box>
        </Card>
    );
}


export default CommentList;
