import React, { useState } from 'react';
import { Avatar, Box, Card, CardContent, Typography, Button, Popper } from '@mui/material';
import { useMutation } from '@apollo/client';
import { FOLLOW_USER, UNFOLLOW_USER } from '../GraphQLQueries/followQueries';
import { useNavigate } from 'react-router-dom';

const ProfileCard = ({ user, anchorEl, onClose, onClick }) => {
    const [localIsFollowed, setLocalIsFollowed] = useState(user.isFollowed);
    const [localFollowerCount, setLocalFollowerCount] = useState(user.followerCount);

    const [followUser] = useMutation(FOLLOW_USER);
    const [unfollowUser] = useMutation(UNFOLLOW_USER);

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

    return (
        <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={onClose} placement="right-start" sx={{
            zIndex: 3
        }}>
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Avatar src={user.profilePicture} sx={{
                            width: 60,
                            height: 60,
                            mr: 2,
                            cursor: 'pointer'
                        }}
                            onClick={onClick}
                        />
                        <Button
                            variant={localIsFollowed ? 'outlined' : 'contained'}
                            onClick={localIsFollowed ? handleUnfollowUser : handleFollowUser}
                            size="small"
                        >
                            {localIsFollowed ? 'Hủy theo dõi' : 'Theo dõi'}
                        </Button>
                    </Box>
                    <Box mt={1}>
                        <Typography variant="subtitle1">
                            {user.username}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {localFollowerCount} người theo dõi
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Popper>
    );
};

const HoverProfileCard = ({ user }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const navigate = useNavigate();

    const handleMouseEnter = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMouseLeave = () => {
        setAnchorEl(null);
    };

    const handleAvatarClick = () => {
        navigate(`/${user.username}`);
    };

    return (
        <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <Avatar src={user.profilePicture} sx={{
                width: 40,
                height: 40,
                cursor: 'pointer'
            }} onClick={handleAvatarClick} />
            <ProfileCard user={user} anchorEl={anchorEl} onClose={handleMouseLeave} onClick={handleAvatarClick} />
        </Box>
    );
};

export default HoverProfileCard;
