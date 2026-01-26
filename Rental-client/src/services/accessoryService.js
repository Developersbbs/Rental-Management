import instance from './instance';

const accessoryService = {
    // Get accessories by rental product ID
    getAccessoriesByProduct: async (rentalProductId) => {
        try {
            const response = await instance.get(`/accessories/product/${rentalProductId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch accessories' };
        }
    },

    // Add a new accessory
    addAccessory: async (rentalProductId, accessoryData) => {
        try {
            const response = await instance.post(`/accessories/product/${rentalProductId}`, accessoryData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to add accessory' };
        }
    },

    // Update accessory
    updateAccessory: async (id, accessoryData) => {
        try {
            const response = await instance.put(`/accessories/${id}`, accessoryData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update accessory' };
        }
    },

    // Delete accessory
    deleteAccessory: async (id) => {
        try {
            const response = await instance.delete(`/accessories/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete accessory' };
        }
    },

    // Get accessory stats
    getAccessoryStats: async () => {
        try {
            const response = await instance.get('/accessories/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch accessory stats' };
        }
    }
};

export default accessoryService;
