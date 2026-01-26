import instance from './instance';

const productItemService = {
    // Get items by product ID
    getItemsByProduct: async (productId) => {
        try {
            const response = await instance.get(`/product-items/product/${productId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch product items' };
        }
    },

    // Add a new item
    addItem: async (productId, itemData) => {
        try {
            const response = await instance.post(`/product-items/product/${productId}`, itemData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to add item' };
        }
    },

    // Update item
    updateItem: async (id, itemData) => {
        try {
            const response = await instance.put(`/product-items/${id}`, itemData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to update item' };
        }
    },

    // Delete item
    deleteItem: async (id) => {
        try {
            const response = await instance.delete(`/product-items/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to delete item' };
        }
    }
};

export default productItemService;
