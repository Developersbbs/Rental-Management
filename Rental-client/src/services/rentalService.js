import instance from './instance';

const rentalService = {
    // Create a new rental
    createRental: async (rentalData) => {
        try {
            const response = await instance.post('/rentals', rentalData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to create rental' };
        }
    },

    // Get all rentals
    getAllRentals: async (params) => {
        try {
            const response = await instance.get('/rentals', { params });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rentals' };
        }
    },

    // Get rental by ID
    getRentalById: async (id) => {
        try {
            const response = await instance.get(`/rentals/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental details' };
        }
    },

    // Return rental items
    returnRental: async (id, returnData) => {
        try {
            const response = await instance.post(`/rentals/${id}/return`, returnData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to process return' };
        }
    },

    // Get Rental Stats
    getRentalStats: async () => {
        try {
            const response = await instance.get('/rentals/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental stats' };
        }
    },

    // Get Rental Notifications
    getRentalNotifications: async () => {
        try {
            const response = await instance.get('/rentals/notifications');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental notifications' };
        }
    },

    // Get Revenue Report
    getRevenueReport: async (year) => {
        try {
            const response = await instance.get(`/rentals/reports/revenue?year=${year || ''}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch revenue report' };
        }
    },

    // Get Most Rented Products
    getMostRentedProducts: async () => {
        try {
            const response = await instance.get('/rentals/reports/popular');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch popular products' };
        }
    },

    // Download Invoice PDF
    downloadInvoice: async (billId) => {
        try {
            const response = await instance.get(`/bills/${billId}/pdf`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to download invoice' };
        }
    },

    // Get Rental Bills (Billing History)
    getRentalBills: async (params) => {
        try {
            const response = await instance.get('/bills', { params: { ...params, type: 'rental' } });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental bills' };
        }
    },

    // Get Bill by ID
    getBillById: async (billId) => {
        try {
            const response = await instance.get(`/bills/${billId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch bill details' };
        }
    }
};

export default rentalService;
