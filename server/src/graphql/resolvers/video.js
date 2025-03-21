const { AuthenticationError } = require('apollo-server-express');
const videoService = require('../../services/videoService');

module.exports = {
  Mutation: {
    uploadVideo: async (_, { file, title, description }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You must be logged in to upload a video');
      }

      try {
        const { createReadStream, filename, mimetype } = await file;
        const stream = createReadStream();

        const video = await videoService.uploadVideo({
          stream,
          filename,
          mimetype,
          title,
          description,
          userId: context.user.id
        });

        return video;
      } catch (error) {
        console.error('Error uploading video:', error);
        throw new Error('Failed to upload video');
      }
    },
  },
};
