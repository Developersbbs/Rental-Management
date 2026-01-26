import axios from './instance';

const billService = {
  /**
   * Fetches a list of bills with optional query parameters.
   * @param {Object} params - Query parameters (e.g., page, limit, search, status).
   * @returns {Promise<Object>} The API response data containing bills and pagination info.
   */
  getBills: async (params = {}) => {
    try {
      const response = await axios.get('/bills', { params });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to fetch bills';
      throw new Error(errorMessage);
    }
  },

  /**
   * Fetches a single bill by ID.
   * @param {string} id - The ID of the bill to fetch.
   * @returns {Promise<Object>} The API response data for the bill.
   */
  getBillById: async (id) => {
    if (!id) {
      throw new Error('Bill ID is required');
    }

    try {
      const response = await axios.get(`/bills/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Bill not found');
      }
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to fetch bill details';
      throw new Error(errorMessage);
    }
  },

  /**
   * Creates a new bill.
   * @param {Object} billData - The data for the new bill.
   * @returns {Promise<Object>} The API response data for the created bill.
   */
  createBill: async (billData) => {
    try {
      const response = await axios.post('/bills', billData);
      return response.data;
    } catch (error) {
      // Re-throw the original error to preserve response data
      throw error;
    }
  },

  /**
   * Updates an existing bill by ID.
   * @param {string} id - The ID of the bill to update.
   * @param {Object} billData - The updated data for the bill.
   * @returns {Promise<Object>} The API response data for the updated bill.
   */
  updateBill: async (id, billData) => {
    if (!id) {
      throw new Error('Bill ID is required');
    }

    try {
      const response = await axios.put(`/bills/${id}`, billData);
      return response.data;
    } catch (error) {
      // Re-throw the original error to preserve response data
      throw error;
    }
  },

  /**
   * Deletes a bill by ID.
   * @param {string} id - The ID of the bill to delete.
   * @returns {Promise<Object>} The API response data (usually a success message).
   */
  deleteBill: async (id) => {
    if (!id) {
      throw new Error('Bill ID is required');
    }

    try {
      const response = await axios.delete(`/bills/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to delete bill';
      throw new Error(errorMessage);
    }
  },

  /**
   * Fetches bill statistics (e.g., total, today, monthly, pending payments).
   * @returns {Promise<Object>} The API response data containing stats.
   */
  getBillStats: async () => {
    try {
      const response = await axios.get('/bills/stats');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to fetch bill statistics';
      throw new Error(errorMessage);
    }
  },

  /**
   * Generates a PDF for a bill.
   * @param {string} id - The ID of the bill to generate PDF for.
   * @returns {Promise<Blob>} The PDF file as a Blob.
   */
  generatePdf: async (id) => {
    if (!id) {
      throw new Error('Bill ID is required');
    }

    try {
      const response = await axios.get(`/bills/${id}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to generate PDF';
      throw new Error(errorMessage);
    }
  },

  /**
   * Sends a bill to a customer via email.
   * @param {string} id - The ID of the bill to send.
   * @param {string} email - The recipient's email address.
   * @returns {Promise<Object>} The API response data.
   */
  sendBillEmail: async (id, email) => {
    if (!id || !email) {
      throw new Error('Bill ID and email are required');
    }

    try {
      const response = await axios.post(`/bills/${id}/send-email`, { email });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to send email';
      throw new Error(errorMessage);
    }
  },

  /**
   * Records a payment for a bill.
   * @param {string} id - The ID of the bill to record payment for.
   * @param {Object} paymentData - Payment details (amount, paymentMethod, paymentDate, notes).
   * @returns {Promise<Object>} The API response data with updated bill.
   */
  recordPayment: async (id, paymentData) => {
    if (!id) {
      throw new Error('Bill ID is required');
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    try {
      const response = await axios.post(`/bills/${id}/record-payment`, paymentData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to record payment';
      throw new Error(errorMessage);
    }
  }
};

export default billService;
