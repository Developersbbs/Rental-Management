import instance from './instance';

const rentalInventoryItemService = {
    // Get items by rental product ID
    getItemsByRentalProduct: async (rentalProductId) => {
        try {
            const response = await instance.get(`/rental-inventory-items/rental-product/${rentalProductId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch rental inventory items' };
        }
    },

    // Get all items
    getAllItems: async () => {
        try {
            const response = await instance.get('/rental-inventory-items');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch all inventory items' };
        }
    },

    // Get item by ID
    getItemById: async (id) => {
        try {
            const response = await instance.get(`/rental-inventory-items/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch item details' };
        }
    },

    // Add a new item
    addItem: async (rentalProductId, itemData) => {
        try {
            const response = await instance.post(`/rental-inventory-items/rental-product/${rentalProductId}`, itemData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to add rental item' };
        }
    },

    // Update item
    updateItem: async (id, itemData) => {
        try {
            const response = await instance.put(`/rental-inventory-items/${id}`, itemData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update rental item' };
        }
    },

    // Delete item
    deleteItem: async (id) => {
        try {
            const response = await instance.delete(`/rental-inventory-items/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete rental item' };
        }
    },

    // Get item history
    getItemHistory: async (id) => {
        try {
            const response = await instance.get(`/rental-inventory-items/${id}/history`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch item history' };
        }
    },

    // Get archived items for a rental product
    getArchivedItems: async (rentalProductId) => {
        try {
            const response = await instance.get(`/rental-inventory-items/archived/${rentalProductId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch archived items' };
        }
    },

    // Toggle archive status
    toggleArchiveStatus: async (id) => {
        try {
            const response = await instance.patch(`/rental-inventory-items/${id}/archive`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update archive status' };
        }
    }
};

export default rentalInventoryItemService;
