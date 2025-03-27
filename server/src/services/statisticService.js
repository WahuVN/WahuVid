import models from '../models/index.js';


const getDailyVideoStatistics = async (userId, startDate, endDate) => {
    // Chuyển đổi startDate và endDate thành đối tượng Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Lấy tất cả video của user trong khoảng thời gian
    const videos = await models.Video.find({
        user: userId,
        createdAt: { $gte: start, $lte: end }
    });

    // Lấy danh sách các videoId
    const videoIds = videos.map(video => video._id);
    // lặp qua tất cả các ngày
    const dailyStats = [];
    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const viewsResult = await models.View.countDocuments({
            video: { $in: videoIds },
            createdAt: { $gte: date, $lte: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
        });
        console.log('viewsResult: ' + viewsResult)

        // const viewsCount = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;
        const likesCount = await models.Like.countDocuments({
            targetId: { $in: videoIds },
            createdAt: { $gte: date, $lte: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
        });
        const commentsCount = await models.Comment.countDocuments({
            videoId: { $in: videoIds },
            createdAt: { $gte: date, $lte: new Date(date.getTime() + 24 * 60 * 60 * 1000) }
        });
        const dailyStat = {
            date: new Date(date),
            views: viewsResult,
            likes: likesCount,
            comments: commentsCount
        };
        dailyStats.push(dailyStat);
    }
    console.log('dailyStats: ' + dailyStats)
    console.log('video ids: ' + videoIds)
    return dailyStats;
};

export default {
    getDailyVideoStatistics,
};
