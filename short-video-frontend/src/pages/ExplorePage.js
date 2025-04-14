import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { SEARCH_QUERY } from '../GraphQLQueries/searchQueries';
import { GET_CATEGORIES } from '../GraphQLQueries/categoryQueries';
import { Box, Typography, Tab, Tabs, Avatar, List, ListItem, ListItemAvatar, ListItemText, Pagination, CircularProgress, Grid } from '@mui/material';
import { User, Video } from 'lucide-react';
import VideoPreview from '../components/VideoPreview';
import HashtagDisplay from '../components/HashtagDisplay';
import LargeNumberDisplay from '../components/LargeNumberDisplay';
import { Person } from '@mui/icons-material';
import { GET_VIDEOS_BY_CATEGORY } from '../GraphQLQueries/videoQueries';
import { handleLinkAWS } from '../utils/commonUtils';


const ExplorePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 12;
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [videos, setVideos] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const { loading, error, data } = useQuery(GET_CATEGORIES);
    const containerRef = useRef(null);
    const { loading: loadingVideos, error: errorVideos, data: dataVideos, fetchMore } = useQuery(GET_VIDEOS_BY_CATEGORY, {
        variables: { categoryId: selectedCategory, page, limit: ITEMS_PER_PAGE },
        notifyOnNetworkStatusChange: true
    });

    useEffect(() => {
        if (data && data.getCategories) {
            setCategories([...data.getCategories]);
            console.log(data.getCategories);
        }
    }, [data]);

    useEffect(() => {
        if (dataVideos && dataVideos.getVideosByCategory) {
            setVideos([...videos, ...dataVideos.getVideosByCategory]);
            setHasMore(dataVideos.getVideosByCategory.length === ITEMS_PER_PAGE);
        }
    }, [dataVideos]);

    useEffect(() => {
        if (location.state) {
            setTabValue(location.state.tabValue || 0);
            setPage(location.state.page || 1);
            setSelectedCategory(location.state.selectedCategory || '');
            setTimeout(() => {
                window.scrollTo(0, location.state.scrollPosition || 0);
            }, 30);
        }
    }, [location]);

    const handleCategoryChange = (event, newValue) => {
        setSelectedCategory(newValue);
        setVideos([]);
        setPage(1);
    };

    const loadMore = useCallback(() => {
        console.log('loading more')
        if (!loadingVideos && hasMore) {
            fetchMore({
                variables: {
                    categoryId: selectedCategory,
                    page: page + 1,
                    limit: ITEMS_PER_PAGE
                }
            }).then((fetchMoreResult) => {
                const newVideos = fetchMoreResult.data.getVideosByCategory;
                if (newVideos.length > 0) {
                    setVideos([...videos, ...newVideos]);
                    setPage(page + 1);
                    setHasMore(newVideos.length === ITEMS_PER_PAGE);
                } else {
                    setHasMore(false);
                }
            });
        }
    }, [loadingVideos, hasMore, fetchMore, selectedCategory, page]);
    console.log(videos)

    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + document.documentElement.scrollTop >= containerRef.current.offsetHeight - 100 &&
                !loadingVideos &&
                hasMore
            ) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMore]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
    if (error) return <Typography color="error">Error: {error.message}</Typography>;

    // const categories = data.categories;

    return (
        <Box sx={{ margin: 'auto', mt: 4, p: 2 }} ref={containerRef}>
            <Box sx={{ maxWidth: '100%', mb: 2 }}>
                <Tabs
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTabs-scrollButtons': {
                            '&.Mui-disabled': { opacity: 0.3 },
                        },
                    }}
                >
                    <Tab label="All" value="" />
                    {categories.map((category) => (
                        <Tab key={category.id} label={category.name} value={category.id} />
                    ))}
                </Tabs>
            </Box>
            <Grid container spacing={1}>
                {videos.map((video, index) => (
                    <Grid item xs={6} md={4} lg={3} key={index}>
                        <VideoPreview
                            isViewed={video.isViewed}
                            likes={video.likeCount}
                            views={video.views}
                            thumbnailUrl={video.thumbnailUrl}
                            userAva={video.user.profilePicture}
                            videoUrl={video.videoUrl}
                            isMuted={false}
                            onClick={() => {
                                navigate(`/${video.user.username}/video/${video.id}`, {
                                    state: {
                                        prevUrl: location.pathname,
                                        tabValue,
                                        page,
                                        selectedCategory,
                                        scrollPosition: window.pageYOffset
                                    }
                                })
                            }}
                        />
                        <Box
                            sx={{
                                maxHeight: '3em', // Approximately 2 lines of text
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mt: 0.5
                            }}
                        >
                            <Typography
                                component={'span'}
                                sx={{
                                    mr: 0.5,
                                    color: 'text.primary'
                                }}
                            >
                                {video.title}
                            </Typography>
                            <HashtagDisplay hashtags={video.tags} />
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <Box onClick={() => navigate(`/${video.user.username}`)} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}>
                                <Avatar src={video.user.profilePicture} sx={{
                                    width: 30, height: 30, mr: 1
                                }} />
                                <Typography>
                                    {video.user.username}
                                </Typography>
                            </Box>
                            <Typography sx={{
                                display: 'flex',
                                alignItems: 'center',
                                lineHeight: '16px',
                                fontSize: '0.9rem'
                            }}>
                                <Person sx={{
                                    height: 20
                                }} />
                                <LargeNumberDisplay number={video.user.followerCount * 19} />
                            </Typography>
                        </Box>
                    </Grid>
                ))}


            </Grid>

            {/* {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            )} */}
        </Box>
    );
};

export default ExplorePage;
