import { Message } from "@mui/icons-material";
import { Avatar, Box, Button, Card, Typography, useTheme } from "@mui/material";
import { FOLLOW_USER, UNFOLLOW_USER } from "../GraphQLQueries/followQueries";
import { useMutation, useQuery } from "@apollo/client";
import { GET_USER_PROFILE } from "../GraphQLQueries/userQueries";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";

const UserInfo = ({ userId }) => {
    const theme = useTheme();
    const { data } = useQuery(GET_USER_PROFILE, {
        variables: { userId },
    });

    const [followUser] = useMutation(FOLLOW_USER);
    const [unfollowUser] = useMutation(UNFOLLOW_USER);
    let user;
    console.log('render user profile')

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
};

export default React.memo(UserInfo);
