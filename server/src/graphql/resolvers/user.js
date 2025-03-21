import { AuthenticationError } from 'apollo-server-express';
import userService from '../../services/userService.js';
import authService from '../../services/authService.js';
import videoService from '../../services/videoService.js';
import likeService from '../../services/likeService.js';

export default {
  Query: {
    me: (_, __, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      return userService.getUserById(user.id);
    },
    user: (_, { id }) => userService.getUserById(id),
    users: (_, { limit, offset }) => userService.getUsers(limit, offset),
  },
  Mutation: {
    signUp: async (_, { username, email, password }) => {
      const user = await userService.createUser({ username, email, password });
      const token = authService.generateToken(user);
      return { token, user };
    },
    signIn: async (_, { email, password }) => {
      const user = await authService.authenticateUser(email, password);
      const token = authService.generateToken(user);
      return { token, user };
    },
    // Other mutations...
  },
  User: {
    videos: (parent) => videoService.getVideosByUserId(parent.id),
    likedVideos: (parent) => likeService.getLikedVideosByUserId(parent.id),
    followers: (parent) => userService.getFollowers(parent.id),
    following: (parent) => userService.getFollowing(parent.id),
  },
};
