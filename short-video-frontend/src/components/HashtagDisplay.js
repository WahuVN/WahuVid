import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HashtagDisplay = ({ hashtags }) => {
    const navigate = useNavigate();

    const handleHashtagClick = (hashtag) => {
        navigate(`/hashtag/${encodeURIComponent(hashtag)}`);
    };

    return (
        <>
            {hashtags.map((hashtag, index) => (
                <Typography
                    key={index}
                    component="span"
                    onClick={() => handleHashtagClick(hashtag)}
                    sx={{
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        color: 'text.primary',
                        '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.main',
                        },
                        marginLeft: '0.5rem',
                    }}
                >
                    {`#${hashtag}`}
                </Typography>
            ))}
        </>
    );
};

export default HashtagDisplay;
