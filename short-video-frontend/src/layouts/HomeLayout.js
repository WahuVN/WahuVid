import React, { useState } from 'react';
import { Container, Grid, useMediaQuery, useTheme } from "@mui/material";
import { Outlet, useLocation } from 'react-router-dom';
import CommentList from '../components/CommentList';
import CommentContext from '../contexts/commentContext'
import Navigation from '../components/Navigation';

const HomeLayout = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [videoId, setVideoId] = useState(null);
    const [isShowComments, setIsShowComments] = useState(false);
    const location = useLocation();
    console.log(location.pathname)

    console.log(videoId);
    return (
        <CommentContext.Provider value={{ showCommentVideoId: setVideoId, setShowComments: setIsShowComments }}>
            <Container maxWidth="full" sx={{
                // mr: -3.5
            }} disableGutters={isSmallScreen}>
            <Grid container spacing={2}>
                <Grid item xs={1} md={2} lg={2}
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        height: 'calc(100vh - 120px)',
                        overflow: 'hidden'
                    }}
                >
                    <Navigation />
                </Grid>
                <Grid item xs={11} md={['/', '/friends', '/following', '/messages', '/upload', '/login', '/register'].includes(location.pathname)?(isShowComments ? 7 : 8) : 10}
                    sx={{
                        height: 'calc(100vh - 64px)',
                        // overflow: 'auto'
                    }}
                >
                    <Outlet />
                </Grid>
                <Grid item xs={1} md={isShowComments ? 3 : 2}
                    sx={{
                        display: { xs: 'none', md: `${['/', '/friends', '/following', '/messages'].includes(location.pathname) ? 'block' :'none' }` },
                        overflow: 'hidden'
                    }}
                >
                    {isShowComments && videoId && <CommentList videoId={videoId} showCommentVideoId={setVideoId} setShowComments={setIsShowComments} />}
                    </Grid>
                </Grid>
            </Container>
        </CommentContext.Provider>
    );
};

export default HomeLayout;
