import models from "../models/index.js";


const saveVideo = async (userId, videoId) => {
    try {
        const existingSave = await models.Save.findOne({
            userId: userId,
            videoId: videoId
        });
        if (existingSave){
            return false;
        }

        const save = new models.Save({
            userId: userId,
            videoId: videoId
        });

        await save.save();

        await models.Video.findByIdAndUpdate(videoId, {
            $inc: { savesCount: 1 }
        });

        return true;
    } catch (error) {
        console.error("Failed to save video", error);
        throw new Error("An error occurred while saving video");
    }
}

const unsaveVideo = async (userId, videoId) => {
    try {
        const result = await models.Save.findOneAndDelete({
            userId: userId,
            videoId: videoId
        });
        if(!result){
            return false;
        }
        await models.Video.findByIdAndUpdate(videoId, {
            $inc: {
                savesCount: -1
            }
        })
        return true;
    } catch (error) {
        console.error("Failed to unsave video", error);
        throw new Error("An error occurred while unsaving video");
    }
}

export default {
    saveVideo,
    unsaveVideo
}
