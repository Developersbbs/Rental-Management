import axios from 'axios';

const API_URL = 'http://localhost:5000/api/accessory-inward';

// Configure axios with credentials
const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

const createAccessoryInward = async (inwardData) => {
    try {
        const response = await axiosInstance.post(API_URL, inwardData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const getAllAccessoryInwards = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key]) {
                queryParams.append(key, params[key]);
            }
        });

        const response = await axiosInstance.get(`${API_URL}?${queryParams.toString()}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const accessoryInwardService = {
    createAccessoryInward,
    getAllAccessoryInwards
};

export default accessoryInwardService;
