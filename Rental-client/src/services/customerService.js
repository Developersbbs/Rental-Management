// services/customerService.js
import axios from './instance';

const customerService = {
  /**
   * Fetches a list of customers with optional query parameters.
   * @param {Object} params - Query parameters (e.g., page, limit, search, status).
   * @returns {Promise<Object>} The API response data containing customers and pagination info.
   */
  getAllCustomers: async (params = {}) => {
    try {
      const response = await axios.get('/customers', { params });
      return response.data;
    } catch (error) {
      // Log the error for debugging (optional)
      // console.error("Error in getAllCustomers:", error);
      // Construct a user-friendly error message
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to fetch customers';
      throw new Error(errorMessage);
    }
  },

  /**
   * Fetches a single customer by ID.
   * This is used, for example, to get detailed info including billing history.
   * @param {string} id - The ID of the customer to fetch.
   * @returns {Promise<Object>} The API response data for the customer.
   */
  getCustomerById: async (id) => {
    // Basic validation
    if (!id) {
      throw new Error('Customer ID is required');
    }

    try {
      const response = await axios.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      // Log the error for debugging (optional)
      // console.error(`Error in getCustomerById (ID: ${id}):`, error);
      // Construct a user-friendly error message
      if (error.response?.status === 404) {
        throw new Error('Customer not found');
      }
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to fetch customer details';
      throw new Error(errorMessage);
    }
  },

  /**
   * Creates a new customer.
   * @param {Object} customerData - The data for the new customer.
   * @returns {Promise<Object>} The API response data for the created customer.
   */
  createCustomer: async (customerData) => {
    // Basic validation could be added here if needed
    try {
      const response = await axios.post('/customers', customerData);
      return response.data;
    } catch (error) {
      // Log the error for debugging (optional)
      // console.error("Error in createCustomer:", error);
      // Construct a user-friendly error message
      // Mongoose validation errors often come as an array in `data.errors`
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).map(e => e.message);
        throw new Error(errorMessages.join(', '));
      }
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to create customer';
      throw new Error(errorMessage);
    }
  },

  /**
   * Updates an existing customer by ID.
   * @param {string} id - The ID of the customer to update.
   * @param {Object} customerData - The updated data for the customer.
   * @returns {Promise<Object>} The API response data for the updated customer.
   */
  updateCustomer: async (id, customerData) => {
    // Basic validation
    if (!id) {
      throw new Error('Customer ID is required');
    }

    try {
      const response = await axios.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      // Log the error for debugging (optional)
      // console.error(`Error in updateCustomer (ID: ${id}):`, error);
      // Construct a user-friendly error message
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).map(e => e.message);
        throw new Error(errorMessages.join(', '));
      }
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to update customer';
      throw new Error(errorMessage);
    }
  },

  /**
   * Deletes a customer by ID.
   * @param {string} id - The ID of the customer to delete.
   * @returns {Promise<Object>} The API response data (usually a success message).
   */
  deleteCustomer: async (id) => {
    // Basic validation
    if (!id) {
      throw new Error('Customer ID is required');
    }

    try {
      const response = await axios.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      // Log the error for debugging (optional)
      // console.error(`Error in deleteCustomer (ID: ${id}):`, error);
      // Construct a user-friendly error message
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to delete customer';
      throw new Error(errorMessage);
    }
  },

  /**
   * Fetches customer statistics (e.g., total, active, inactive counts).
   * @returns {Promise<Object>} The API response data containing stats.
   */
  getCustomerStats: async () => {
    try {
      const response = await axios.get('/customers/stats');
      return response.data;
    } catch (error) {
      // Log the error for debugging (optional)
      // console.error("Error in getCustomerStats:", error);
      // Construct a user-friendly error message
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to fetch customer statistics';
      throw new Error(errorMessage);
    }
  },

  /**
   * Blocks a customer.
   * @param {string} id - The ID of the customer to block.
   * @returns {Promise<Object>} The API response data.
   */
  blockCustomer: async (id) => {
    if (!id) throw new Error('Customer ID is required');
    try {
      const response = await axios.patch(`/customers/${id}/block`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to block customer';
      throw new Error(errorMessage);
    }
  },

  /**
   * Unblocks a customer.
   * @param {string} id - The ID of the customer to unblock.
   * @returns {Promise<Object>} The API response data.
   */
  unblockCustomer: async (id) => {
    if (!id) throw new Error('Customer ID is required');
    try {
      const response = await axios.patch(`/customers/${id}/unblock`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to unblock customer';
      throw new Error(errorMessage);
    }
  }
};

export default customerService;