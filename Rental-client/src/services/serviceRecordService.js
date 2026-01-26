import axios from './instance';

const serviceRecordService = {
    /**
     * Create a new service record
     */
    createServiceRecord: async (data) => {
        try {
            const response = await axios.post('/service-records', data);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create service record');
        }
    },

    /**
     * Get all service records with filters
     */
    getServiceRecords: async (params = {}) => {
        try {
            const response = await axios.get('/service-records', { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch service records');
        }
    },

    /**
     * Get service record by ID
     */
    getServiceRecordById: async (id) => {
        try {
            const response = await axios.get(`/service-records/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch service record');
        }
    },

    /**
     * Update service record
     */
    updateServiceRecord: async (id, data) => {
        try {
            const response = await axios.put(`/service-records/${id}`, data);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update service record');
        }
    },

    /**
     * Delete service record
     */
    deleteServiceRecord: async (id) => {
        try {
            const response = await axios.delete(`/service-records/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete service record');
        }
    },

    /**
     * Get service history for a specific item
     */
    getItemServiceHistory: async (itemId) => {
        try {
            const response = await axios.get(`/service-records/item/${itemId}/history`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch service history');
        }
    },

    /**
     * Get service analytics
     */
    getServiceAnalytics: async (params = {}) => {
        try {
            const response = await axios.get('/service-records/analytics/summary', { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
        }
    },

    /**
     * Get upcoming and overdue maintenance
     */
    getUpcomingMaintenance: async (days = 30) => {
        try {
            const response = await axios.get('/service-records/analytics/upcoming', {
                params: { days }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch upcoming maintenance');
        }
    },

    /**
     * Get cost analysis
     */
    getCostAnalysis: async (params = {}) => {
        try {
            const response = await axios.get('/service-records/analytics/costs', { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch cost analysis');
        }
    }
};

export default serviceRecordService;
