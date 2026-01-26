import instance from './instance';

const paymentAccountService = {
    /**
     * Get all payment accounts
     * @param {Object} params - Query parameters (status, accountType)
     * @returns {Promise<Object>} Payment accounts data
     */
    getAllPaymentAccounts: async (params = {}) => {
        try {
            const response = await instance.get('/payment-accounts', { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch payment accounts');
        }
    },

    /**
     * Get payment account by ID
     * @param {String} id - Payment Account ID
     * @returns {Promise<Object>} Payment account data
     */
    getPaymentAccountById: async (id) => {
        try {
            const response = await instance.get(`/payment-accounts/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch payment account');
        }
    },

    /**
     * Create new payment account
     * @param {Object} accountData - Payment account data
     * @returns {Promise<Object>} Created account
     */
    createPaymentAccount: async (accountData) => {
        try {
            const response = await instance.post('/payment-accounts', accountData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create payment account');
        }
    },

    /**
     * Update payment account
     * @param {String} id - Payment Account ID
     * @param {Object} accountData - Updated account data
     * @returns {Promise<Object>} Updated account
     */
    updatePaymentAccount: async (id, accountData) => {
        try {
            const response = await instance.put(`/payment-accounts/${id}`, accountData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update payment account');
        }
    },

    /**
     * Delete (deactivate) payment account
     * @param {String} id - Payment Account ID
     * @returns {Promise<Object>} Success message
     */
    deletePaymentAccount: async (id) => {
        try {
            const response = await instance.delete(`/payment-accounts/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete payment account');
        }
    },

    /**
     * Get account transactions
     * @param {String} id - Payment Account ID
     * @param {Object} params - Query parameters (startDate, endDate, limit)
     * @returns {Promise<Object>} Account transactions
     */
    getAccountTransactions: async (id, params = {}) => {
        try {
            const response = await instance.get(`/payment-accounts/${id}/transactions`, { params });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch account transactions');
        }
    }
};

export default paymentAccountService;
