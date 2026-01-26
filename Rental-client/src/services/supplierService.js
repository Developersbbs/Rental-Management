// services/supplierService.js
import axios from './instance';

const supplierService = {
  // Get all suppliers
  getAllSuppliers: async (params = {}) => {
    try {
      const response = await axios.get('/suppliers', { params });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch suppliers';
      console.error('SupplierService Error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Get supplier by ID
  getSupplierById: async (id) => {
    try {
      const response = await axios.get(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch supplier';
      console.error('SupplierService Error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Get products by supplier ID
  getSupplierProducts: async (id) => {
    try {
      const response = await axios.get(`/suppliers/${id}/products`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch supplier products';
      console.error('SupplierService Error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Create new supplier
  createSupplier: async (supplierData) => {
    try {
      const response = await axios.post('/suppliers', supplierData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create supplier';
      console.error('SupplierService Error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Update supplier
  updateSupplier: async (id, supplierData) => {
    try {
      const response = await axios.put(`/suppliers/${id}`, supplierData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update supplier';
      console.error('SupplierService Error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Delete supplier
  deleteSupplier: async (id) => {
    try {
      const response = await axios.delete(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete supplier';
      console.error('SupplierService Error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // Get supplier statistics
  getSupplierStats: async () => {
    try {
      const response = await axios.get('/suppliers/stats');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch supplier stats';
      console.error('SupplierService Error:', errorMessage);
      throw new Error(errorMessage);
    }
  }
};

export default supplierService;