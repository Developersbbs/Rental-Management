import instance from './instance';

const categoryService = {
  async getAllCategories(status = 'active') {
    // If status is explicitly set to null, pass 'all' to get all categories
    const params = status === null ? { status: 'all' } : { status };
    const response = await instance.get('/categories', { params });
    const categories = response.data.categories || [];
    return categories.map(category => ({
      id: category._id,
      name: category.name,
      status: category.status
    }));
  },

  async createCategory(payload) {
    const response = await instance.post('/categories', payload);
    return response.data;
  },

  async updateCategory(id, payload) {
    const response = await instance.put(`/categories/${id}`, payload);
    return response.data;
  },

  async toggleCategoryStatus(id, status) {
    const response = await instance.patch(`/categories/${id}/status`, { status });
    return response.data;
  },

  async deleteCategory(id) {
    const response = await instance.delete(`/categories/${id}`);
    return response.data;
  }
};

export default categoryService;
