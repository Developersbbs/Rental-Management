import instance from './instance';

const rentalInwardService = {
    // Create rental inward
    createRentalInward: async (data) => {
        try {
            console.log('📡 Calling API: POST /rental-inwards', data);
            const response = await instance.post('/rental-inwards', data);
            console.log('📡 API Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('📡 API Error:', error);
            console.error('📡 Error Response:', error.response);

            // Extract detailed error information
            const errorData = error.response?.data || {};
            const errorMessage = errorData.message || errorData.error || error.message || 'Failed to create rental inward';
            const statusCode = error.response?.status;

            // Create a detailed error object
            const detailedError = new Error(errorMessage);
            detailedError.response = error.response;
            detailedError.statusCode = statusCode;

            throw detailedError;
        }
    },

    // Get all rental inwards
    getAllRentalInwards: async (params) => {
        try {
            const response = await instance.get('/rental-inwards', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental inwards' };
        }
    },

    // Get rental inward by ID
    getRentalInwardById: async (id) => {
        try {
            const response = await instance.get(`/rental-inwards/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental inward details' };
        }
    },

    // Update rental inward
    updateRentalInward: async (id, data) => {
        try {
            const response = await instance.put(`/rental-inwards/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update rental inward' };
        }
    },

    // Delete rental inward
    deleteRentalInward: async (id) => {
        try {
            const response = await instance.delete(`/rental-inwards/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete rental inward' };
        }
    }
};

export default rentalInwardService;
