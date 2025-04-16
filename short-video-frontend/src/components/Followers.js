import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
    Box,
    Typography,
    List,
    ListItem,
    Avatar,
    CircularProgress
} from '@mui/material';
import { Person } from '@mui/icons-material';
import LargeNumberDisplay from '../components/LargeNumberDisplay';

export const GET_FOLLOWERS_BY_USER_ID = gql`
  query getFollowersByUserId($userId: ID!) {
    getFollowersByUserId(userId: $userId) {
      createdAt
      id
      email
      followerCount
      followingCount
      isFollowed
      profilePicture
      username
    }
  }
`;

const Followers = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { loading, error, data } = useQuery(GET_FOLLOWERS_BY_USER_ID, {
        variables: { userId },
    });

    if (loading) return (
        <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Typography color="error" textAlign="center" mt={4}>
            Error loading followers: {error.message}
        </Typography>
    );

    return (
        <Box sx={{ maxWidth: 600, margin: 'auto', p: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Followers
            </Typography>

            <List sx={{ bgcolor: 'background.paper' }}>
                {data.getFollowersByUserId.map((follower) => (
                    <ListItem
                        key={follower.id}
                        onClick={() => navigate(`/${follower.username}`)}
                        sx={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #e0e0e0',
                            py: 1.5,
                            px: 2,
                            '&:hover': {
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                src={follower.profilePicture}
                                sx={{ width: 40, height: 40, mr: 2 }}
                            />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {follower.username}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
                            <LargeNumberDisplay number={follower.followerCount} />
                        </Box>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default Followers;