import instance from './instance';

const rentalSupplierService = {
    // Create rental supplier
    createRentalSupplier: async (data) => {
        try {
            const response = await instance.post('/rental-suppliers', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create rental supplier' };
        }
    },

    // Get all rental suppliers
    getAllRentalSuppliers: async (params) => {
        try {
            const response = await instance.get('/rental-suppliers', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental suppliers' };
        }
    },

    // Get rental supplier by ID
    getRentalSupplierById: async (id) => {
        try {
            const response = await instance.get(`/rental-suppliers/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental supplier details' };
        }
    },

    // Update rental supplier
    updateRentalSupplier: async (id, data) => {
        try {
            const response = await instance.put(`/rental-suppliers/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update rental supplier' };
        }
    },

    // Delete rental supplier
    deleteRentalSupplier: async (id) => {
        try {
            const response = await instance.delete(`/rental-suppliers/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete rental supplier' };
        }
    }
};

export default rentalSupplierService;
