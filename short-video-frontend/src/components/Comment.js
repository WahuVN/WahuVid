import { Avatar, Box, Button, Collapse, IconButton, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/vi";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { useMutation } from "@apollo/client";
import { LIKE_COMMENT, UNLIKE_COMMENT } from "../GraphQLQueries/likeQueries";
import { Heart } from "lucide-react";
moment.locale("vi");

const Comment = ({ comment, isReply = false, handleReply = () => { }, toggleCommentExpansion = () => { }, expandedComments }) => {
    const [localIsLikedComment, setLocalIsLikedComment] = useState(comment.isLiked);
    const [localCommentLikesCount, setLocalCommentLikesCount] = useState(comment.likeCount);

    const navigate = useNavigate();

    const [likeComment] = useMutation(LIKE_COMMENT);
    const [unlikeComment] = useMutation(UNLIKE_COMMENT);

    const handleUnlikeComment = () => {
        if(localIsLikedComment) {
            setLocalIsLikedComment(false);
            setLocalCommentLikesCount(pre => pre - 1);
            unlikeComment({
                variables: {
                    targetId: comment.id,
                }
            });
        }
    };

    const handleLikeComment = () => {
        if(!localIsLikedComment) {
            setLocalIsLikedComment(true);
            setLocalCommentLikesCount(pre => pre + 1);
            likeComment({
                variables: {
                    targetId: comment.id,
                }
            });
        }
    };
    return (
        <Box key={comment.id} sx={{ ml: isReply ? 4 : 0, mt: 1 }}>
            <Box display="flex" alignItems="center">
                <Avatar src={comment.user.profilePicture} onClick={() => navigate(`/${comment.user.username}`)} sx={{ width: 32, height: 32, mr: 1, cursor: 'pointer' }} />
                <Typography variant="subtitle2" onClick={() => navigate(`/${comment.user.username}`)} sx={{ cursor: 'pointer' }}>{comment.user.username}</Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>{comment.content}</Typography>
            <Box display="flex" alignItems="center" mt={1}>
                <IconButton size="small" onClick={localIsLikedComment ? handleUnlikeComment : handleLikeComment}>
                    <Heart size={18} fill={localIsLikedComment ? 'red' : 'none'} color={localIsLikedComment ? 'red' : 'currentColor'} />
                </IconButton>
                <Typography variant="caption" sx={{ ml: 1 }}>{localCommentLikesCount} lượt thích</Typography>
                <Typography variant="caption" sx={{ ml: 2 }}>{moment(comment.createdAt).fromNow()}</Typography>
                {!isReply && (
                    <Button size="small" onClick={() => handleReply(comment.id)} sx={{ ml: 2 }}>
                        Trả lời
                    </Button>
                )}
            </Box>
            {!isReply && comment.replies && comment.replies.length > 0 && (
                <>
                    <Button
                        size="small"
                        onClick={() => toggleCommentExpansion(comment.id)}
                        startIcon={expandedComments[comment.id] ? <ExpandLess /> : <ExpandMore />}
                        sx={{ mt: 0.2 }}
                    >
                        {expandedComments[comment.id] ? 'Ẩn' : 'Hiển thị'} {comment.replies.length} câu trả lời
                    </Button>
                    <Collapse in={expandedComments[comment.id]}>
                        {comment.replies.map(reply => <Comment key={reply.id} comment={reply} isReply={true} />)}
                    </Collapse>
                </>
            )}
        </Box>
    )
};

export default Comment;
