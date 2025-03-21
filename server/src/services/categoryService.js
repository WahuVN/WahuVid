import models from "../models/index.js"


const getCategories = async () => {
    return await models.Category.find();
}

const getCategory = async (categoryId) => {
    return await models.Category.findById(categoryId);
}

export default {
    getCategories,
    getCategory
}
