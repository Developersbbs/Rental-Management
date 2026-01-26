import instance from './instance';

const billApiService = {
  // Get all bills with optional filtering
  getAllBills: async (params = {}) => {
    try {
      const response = await instance.get('/bills', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch bills');
    }
  },

  // Get bill by ID
  getBillById: async (id) => {
    try {
      const response = await instance.get(`/bills/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch bill');
    }
  },

  // Create new bill
  createBill: async (billData) => {
    try {
      const response = await instance.post('/bills', billData);
      return response.data;
    } catch (error) {
      // Re-throw the original error to preserve response data
      throw error;
    }
  },

  // Update bill
  updateBill: async (id, billData) => {
    try {
      const response = await instance.put(`/bills/${id}`, billData);
      return response.data;
    } catch (error) {
      // Re-throw the original error to preserve response data
      throw error;
    }
  },

  // Delete bill
  deleteBill: async (id) => {
    try {
      const response = await instance.delete(`/bills/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete bill');
    }
  },

  // Get bills by customer ID
  getBillsByCustomer: async (customerId) => {
    try {
      const response = await instance.get(`/bills/customer/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch customer bills');
    }
  },

  // Get bill statistics
  getBillStats: async () => {
    try {
      const response = await instance.get('/bills/stats');
      return response.data;
    } catch (error) {
      // If stats endpoint doesn't exist, calculate from bills
      const bills = await billApiService.getAllBills();
      return billApiService.calculateStats(bills.bills || bills);
    }
  },

  // Get selling report
  getSellingReport: async (params = {}) => {
    try {
      const response = await instance.get('/bills/selling-report', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch selling report');
    }
  },

  // Get detailed selling data for a specific product
  getProductSellingDetails: async (productId, params = {}) => {
    try {
      const response = await instance.get(`/bills/product-selling/${productId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product selling details');
    }
  },

  // Get monthly selling report
  getMonthlySellingReport: async (params = {}) => {
    try {
      const response = await instance.get('/bills/monthly-selling-report', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch monthly selling report');
    }
  },

  // Calculate statistics from bill data
  calculateStats: (bills) => {
    const stats = {
      total: bills.length,
      totalAmount: 0,
      paid: 0,
      partial: 0,
      unpaid: 0,
      averageAmount: 0
    };

    bills.forEach(bill => {
      stats.totalAmount += bill.totalAmount || 0;
      
      switch (bill.paymentStatus) {
        case 'paid':
          stats.paid++;
          break;
        case 'partial':
          stats.partial++;
          break;
        default:
          stats.unpaid++;
      }
    });

    stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;

    return stats;
  }
};

export default billApiService;
