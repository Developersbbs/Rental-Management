import instance from './instance';

const rentalProductService = {
    // Create rental product
    createRentalProduct: async (data) => {
        try {
            const response = await instance.post('/rental-products', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create rental product' };
        }
    },

    // Get all rental products
    getAllRentalProducts: async (params) => {
        try {
            const response = await instance.get('/rental-products', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental products' };
        }
    },

    // Get rental product by ID
    getRentalProductById: async (id) => {
        try {
            const response = await instance.get(`/rental-products/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental product details' };
        }
    },

    // Update rental product
    updateRentalProduct: async (id, data) => {
        try {
            const response = await instance.put(`/rental-products/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update rental product' };
        }
    },

    // Delete rental product
    deleteRentalProduct: async (id) => {
        try {
            const response = await instance.delete(`/rental-products/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete rental product' };
        }
    }
};

export default rentalProductService;
