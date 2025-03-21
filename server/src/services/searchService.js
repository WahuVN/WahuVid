import models from "../models/index.js";

const search = async (query, page = 1, limit = 10 ) => {
    const skip = (page - 1) * limit;

      const userQuery = models.User.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } });

      const videoQuery = models.Video.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } });

      const [users, videos, totalUsers, totalVideos] = await Promise.all([
        userQuery.skip(skip).limit(limit),
        videoQuery.skip(skip).limit(limit),
        models.User.countDocuments({ $text: { $search: query } }),
        models.Video.countDocuments({ $text: { $search: query } })
      ]);

      return {
        users,
        videos,
        totalUsers,
        totalVideos
      };
};

export default {
    search
}
