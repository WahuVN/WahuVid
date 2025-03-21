import { Close } from "@mui/icons-material";
import { Box, IconButton, TextField, useTheme } from "@mui/material";
import { Send } from "lucide-react";
import { useState } from "react";

const CommentInput = ({ handleSubmit = () => { }, onCloseClick = () => { }, replyingTo }) => {
    const [commentContent, setCommentContent] = useState('');
    const theme = useTheme();

    const handleSubmitLocal = () => {
        handleSubmit(commentContent);
        setCommentContent('');
    }

    return (
        <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}`, zIndex: 10 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={replyingTo ? "Nhập câu trả lời..." : "Nhập bình luận..."}
                    size="small"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    onKeyUp={(e) => {
                        if (e.key === 'Enter') {
                            handleSubmitLocal();
                        }
                    }}
                />
                <IconButton sx={{ ml: 1 }} onClick={handleSubmitLocal}>
                    <Send />
                </IconButton>
                {replyingTo && (
                    <IconButton sx={{ ml: 1 }} onClick={onCloseClick}>
                        <Close />
                    </IconButton>
                )}
            </Box>
        </Box>);
};

export default CommentInput;
