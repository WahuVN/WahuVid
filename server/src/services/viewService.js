import models from "../models/index.js"

const viewVideo = async (userId, videoId, viewCount) => {
    try {
        const existView = await models.View.findOne({
            user: userId,
            video: videoId
        });
        if(existView){
            console.log("exists " )
            await models.View.updateOne(
                { _id: existView._id },
                { $inc: { viewCount: viewCount } }
            );
        } else {
            console.log("not exists" )
            const newView = new models.View({
                user: userId,
                video: videoId,
                viewCount: viewCount
            });
            await newView.save();
        }
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                views: viewCount
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
