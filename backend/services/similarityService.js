import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

export const checkTitleSimilarity = async ({ queryTitle, candidates, topK = 10 }) => {
    const response = await axios.post(`${ML_SERVICE_URL}/similarity/search`, {
        query_title: queryTitle,
        candidates,
        top_k: topK,
    });

    return response.data;
};

export const checkPairSimilarity = async ({ title1, title2 }) => {
    const response = await axios.post(`${ML_SERVICE_URL}/similarity/pair`, {
        title_1: title1,
        title_2: title2,
    });

    return response.data;
};