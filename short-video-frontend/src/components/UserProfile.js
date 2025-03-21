import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Box, Typography, CircularProgress, Grid, Card, Container, Avatar, Button, useTheme } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import VideoPreview from './VideoPreview';
import { debounce } from 'lodash';
import { FOLLOW_USER, UNFOLLOW_USER } from '../GraphQLQueries/followQueries';
import { GET_USER_PROFILE } from '../GraphQLQueries/userQueries';
import { GET_USER_VIDEO } from '../GraphQLQueries/videoQueries';
import { Message } from '@mui/icons-material';


const VIDEOS_PER_PAGE = 12;

const UserInfo = ({ userId }) => {
    const theme = useTheme();
    const { data } = useQuery(GET_USER_PROFILE, {
        variables: { userId },
    });

    const [followUser] = useMutation(FOLLOW_USER);
    const [unfollowUser] = useMutation(UNFOLLOW_USER);
    let user;

    const [localFollowerCount, setLocalFollowerCount] = useState(0);
    const [localIsFollowed, setLocalIsFollowed] = useState(false);

    const navigate = useNavigate();
    const handleFollowUser = async () => {
        try {
            await followUser({
                variables: { followingId: user?.id },
            });
            setLocalIsFollowed(true);
            setLocalFollowerCount(prev => prev + 1);
        } catch (error) {
            console.error("Follow error", error);
        }
    };

    const handleUnfollowUser = async () => {
        try {
            await unfollowUser({
                variables: { followingId: user?.id },
            });
            setLocalIsFollowed(false);
            setLocalFollowerCount(prev => prev - 1);
        } catch (error) {
            console.error("Unfollow error", error);
        }
    };
    user = data?.getUser;
    useEffect(() => {
        if (user) {
            setLocalFollowerCount(user.followerCount);
            setLocalIsFollowed(user.isFollowed);
        }
    }, [data])

    const startConversation = () => {
        navigate(`/messages/${user.username}`);
    };

    // useEffect(() => {
    //     if (location.state) {
    //         console.log(location.state.isFollowed)
    //         if (location.state.isFollowed !== localIsFollowed) {
    //             if (location.state.isFollowed === true) {
    //                 setLocalFollowerCount(pre => pre + 1);
    //             }
    //             else {
    //                 setLocalFollowerCount(pre => pre - 1);
    //             }
    //             setLocalIsFollowed(location.state.isFollowed);
    //         }
    //     }
    // }, [navigate, location]);
    if (!user) return null;

    return (
        <Card sx={{ mb: 2, p: 3 }}>
            <Box sx={{ display: 'flex' }}>
                <Avatar src={user.profilePicture} sx={{ width: 120, height: 120, mr: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography variant="h4" component="h1" fontWeight={700} margin={0}>
                        {user.username}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {user.email}
                    </Typography>
                    <Box>
                        <Button
                            variant={localIsFollowed ? 'outlined' : 'contained'}
                            sx={{
                                backgroundColor: localIsFollowed ? 'transparent' : theme.palette.primary.main,
                                color: localIsFollowed ? theme.palette.primary.main : theme.palette.primary.contrastText,
                                '&:hover': {
                                    backgroundColor: localIsFollowed ? theme.palette.primary.light : theme.palette.primary.dark,
                                },
                                maxWidth: '200px',
                                mr: 1,
                            }}
                            onClick={localIsFollowed ? handleUnfollowUser : handleFollowUser}
                        >
                            {localIsFollowed ? 'Hủy theo dõi' : 'Theo dõi'}
                        </Button>
                        <Button
                            variant={'contained'}
                            sx={{
                                backgroundColor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                },
                                maxWidth: '200px',
                            }}
                            onClick={startConversation}
                        >
                            <Message />
                        </Button>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', mt: 2 }}>
                <Typography sx={{ mr: 2 }}>
                    {user.followingCount} Đang theo dõi
                </Typography>
                <Typography>
                    {localFollowerCount} Người theo dõi
                </Typography>
            </Box>
        </Card>
    );
}

const UserProfile = () => {
    const { userId } = useParams();
    const [page, setPage] = useState(1);
    const [videos, setVideos] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const { loading, error, data, fetchMore } = useQuery(GET_USER_VIDEO, {
        variables: { id: userId, page: 1, limit: VIDEOS_PER_PAGE },
    });

    useEffect(() => {
        if (data?.getUserVideos) {
            setVideos(data.getUserVideos);
            setHasMore(data.getUserVideos.length >= VIDEOS_PER_PAGE);
        }
    }, [data, userId]);

    const loadMore = useCallback(debounce(() => {
        if (!hasMore || loading) return;

        fetchMore({
            variables: {
                id: userId,
                page: page + 1,
                limit: VIDEOS_PER_PAGE,
            },
        }).then((fetchMoreResult) => {
            const newVideos = fetchMoreResult.data.getUserVideos;
            if (newVideos.length > 0) {
                setVideos([...videos, ...newVideos]);
                setPage(page + 1);
                setHasMore(newVideos.length === VIDEOS_PER_PAGE);
            } else {
                setHasMore(false);
            }
        });
    }, 100), [fetchMore, hasMore, loading, page, userId]);

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop
                >= containerRef.current.offsetHeight - 100
            ) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);



    if (loading && page === 1) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error.message}</Typography>;


    return (
        <Container maxWidth="lg" ref={containerRef}>
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <UserInfo userId={userId} />
                <Grid container spacing={0.5}>
                    {videos.map((video) => (
                        <Grid item xs={6} sm={4} md={4} lg={3} key={video.id}>
                            <VideoPreview
                                videoUrl={video.videoUrl}
                                thumbnailUrl={video.thumbnailUrl}
                                views={video.views}
                                likes={video.likeCount}
                                isViewed={video.isViewed}
                                onClick={() => {
                                    navigate(`/${userId}/video/${video.id}`, {
                                        state: {
                                            prevUrl: location.pathname
                                        }
                                    })
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>
                {loading && page > 1 && <CircularProgress sx={{ mt: 2 }} />}
                {!hasMore && <Typography sx={{ mt: 2, textAlign: 'center' }}>No more videos to load</Typography>}
            </Box>
        </Container>
    );
};

export default UserProfile;
