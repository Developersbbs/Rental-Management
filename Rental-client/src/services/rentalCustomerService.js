import instance from './instance';

const rentalCustomerService = {
    // Create rental customer
    createRentalCustomer: async (data) => {
        try {
            const response = await instance.post('/rental-customers', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create rental customer' };
        }
    },

    // Get all rental customers
    getAllRentalCustomers: async (params) => {
        try {
            const response = await instance.get('/rental-customers', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental customers' };
        }
    },

    // Get rental customer by ID
    getRentalCustomerById: async (id) => {
        try {
            const response = await instance.get(`/rental-customers/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental customer details' };
        }
    },

    // Update rental customer
    updateRentalCustomer: async (id, data) => {
        try {
            const response = await instance.put(`/rental-customers/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update rental customer' };
        }
    },

    // Delete rental customer
    deleteRentalCustomer: async (id) => {
        try {
            const response = await instance.delete(`/rental-customers/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete rental customer' };
        }
    },

    // Block rental customer
    blockRentalCustomer: async (id) => {
        try {
            const response = await instance.patch(`/rental-customers/${id}/block`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to block rental customer' };
        }
    },

    // Unblock rental customer
    unblockRentalCustomer: async (id) => {
        try {
            const response = await instance.patch(`/rental-customers/${id}/unblock`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to unblock rental customer' };
        }
    }
};

export default rentalCustomerService;
