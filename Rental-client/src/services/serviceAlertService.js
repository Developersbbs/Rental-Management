import instance from './instance';

const serviceAlertService = {
    /**
     * Get all service alerts with optional filters
     * @param {Object} params - Query parameters (status, severity, startDate, endDate)
     * @returns {Promise<Object>} Service alerts data
     */
    getServiceAlerts: async (params = {}) => {
        try {
            const response = await instance.get('/service-alerts', { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch service alerts');
        }
    },

    /**
     * Get dashboard service alerts (active/critical only)
     * @returns {Promise<Object>} Dashboard alerts with stats
     */
    getDashboardAlerts: async () => {
        try {
            const response = await instance.get('/service-alerts/dashboard');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch dashboard alerts');
        }
    },

    /**
     * Acknowledge a service alert
     * @param {String} id - Alert ID
     * @param {String} notes - Optional notes
     * @returns {Promise<Object>} Updated alert
     */
    acknowledgeAlert: async (id, notes = '') => {
        try {
            const response = await instance.put(`/service-alerts/${id}/acknowledge`, { notes });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to acknowledge alert');
        }
    },

    /**
     * Dismiss a service alert
     * @param {String} id - Alert ID
     * @param {String} notes - Optional notes
     * @returns {Promise<Object>} Updated alert
     */
    dismissAlert: async (id, notes = '') => {
        try {
            const response = await instance.put(`/service-alerts/${id}/dismiss`, { notes });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to dismiss alert');
        }
    },

    /**
     * Get service alerts for a specific product
     * @param {String} productId - Rental Product ID
     * @returns {Promise<Object>} Product alerts
     */
    getProductAlerts: async (productId) => {
        try {
            const response = await instance.get(`/service-alerts/product/${productId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch product alerts');
        }
    }
};

export default serviceAlertService;
