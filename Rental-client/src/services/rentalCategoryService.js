import instance from './instance';

const rentalCategoryService = {
    // Create rental category
    createRentalCategory: async (data) => {
        try {
            const response = await instance.post('/rental-categories', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create rental category' };
        }
    },

    // Get all rental categories
    getAllRentalCategories: async (params) => {
        try {
            const response = await instance.get('/rental-categories', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental categories' };
        }
    },

    // Get rental category by ID
    getRentalCategoryById: async (id) => {
        try {
            const response = await instance.get(`/rental-categories/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental category details' };
        }
    },

    // Update rental category
    updateRentalCategory: async (id, data) => {
        try {
            const response = await instance.put(`/rental-categories/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update rental category' };
        }
    },

    // Delete rental category
    deleteRentalCategory: async (id) => {
        try {
            const response = await instance.delete(`/rental-categories/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete rental category' };
        }
    }
};

export default rentalCategoryService;
