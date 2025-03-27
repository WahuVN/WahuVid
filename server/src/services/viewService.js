import models from "../models/index.js"

const viewVideo = async (userId, videoId) => {
    try {
        const existView = await models.View.findOne({
            user: userId,
            video: videoId
        });
        if (existView) {
            console.log("exists ")
            await models.View.updateOne(
                { _id: existView._id },
                { $inc: { viewCount: 1 } }
            );
        } else {
            console.log("not exists")
            const newView = new models.View({
                user: userId,
                video: videoId,
                viewCount: 1
            });
            await newView.save();
        }
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                views: 1
            }
        });
        return true;
    } catch (error) {
        console.error("Error viewing video", error);
        return false;
    }
}

export default {
    viewVideo
}
