import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { SEARCH_QUERY } from '../GraphQLQueries/searchQueries';
import { Box, Typography, Tab, Tabs, Avatar, List, ListItem, ListItemAvatar, ListItemText, Pagination, CircularProgress, Grid } from '@mui/material';
import { User, Video } from 'lucide-react';
import VideoPreview from '../components/VideoPreview';
import HashtagDisplay from '../components/HashtagDisplay';
import LargeNumberDisplay from '../components/LargeNumberDisplay';
import { Person } from '@mui/icons-material';

const SearchPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search).get('query') || '';
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const { loading, error, data, refetch } = useQuery(SEARCH_QUERY, {
        variables: { query, page, limit: ITEMS_PER_PAGE },
        fetchPolicy: 'network-only',
    });

    useEffect(() => {
        refetch({ query, page, limit: ITEMS_PER_PAGE });
    }, [query, page, refetch]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
    if (error) return <Typography color="error">Error: {error.message}</Typography>;

    const { users, videos } = data.search;
    const currentResults = tabValue === 0 ? videos : users;
    const totalPages = Math.ceil(currentResults.length / ITEMS_PER_PAGE);

    return (
        <Box sx={{ margin: 'auto', mt: 4, p: 2 }}>
            <Typography variant="h4" gutterBottom>Kết quả tìm kiếm cho "{query}"</Typography>

            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label={`Videos (${videos.length})`} />
                <Tab label={`Người dùng (${users.length})`} />
            </Tabs>
            {tabValue === 0 ? (
                <Grid container spacing={1}>
                    {currentResults.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((item) => (
                    <Grid item xs={6} md={4} lg={3} key={item.id}>
                        <VideoPreview
                            isViewed={item.isViewed}
                            likes={item.likeCount}
                            views={item.views}
                            thumbnailUrl={item.thumbnailUrl}
                            videoUrl={item.videoUrl}
                            userAva={item.user.profilePicture}
                            isMuted={false}
                            onClick={() => {
                                navigate(`/${item.user.username}/video/${item.id}`, {
                                    state: {
                                        prevUrl: location.pathname
                                    }
                                })
                            }}
                        />
                        <Box
                            sx={{
                                maxHeight: '3em',
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
                            >
                                {item.title}
                            </Typography>
                            <HashtagDisplay hashtags={item.tags} />
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <Box onClick={() => navigate(`/${item.user.username}`)} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}>
                                <Avatar src={item.user.profilePicture} sx={{
                                    width: 30, height: 30, mr: 1
                                }} />
                                <Typography>
                                    {item.user.username}
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
                                <LargeNumberDisplay number={item.user.followerCount * 12313} />
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>) : (<>
                {currentResults.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((item) => (
                    <ListItem key={item.id} onClick={() => navigate(`/${item.username}`)} sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #e0e0e0',
                        padding: '10px 10px',
                        '&:hover': {
                            backgroundColor: '#f0f0f0'
                        }
                    }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Avatar src={item.profilePicture} sx={{
                                width: 30, height: 30, mr: 1
                            }} />
                            <Typography>{item.username}</Typography>
                        </Box>
                        <Typography> <Person sx={{ height: 20 }} />{item.followerCount}</Typography>
                    </ListItem>
                ))}
            </>)}

            {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            )}
        </Box>
    );
};

export default SearchPage;
