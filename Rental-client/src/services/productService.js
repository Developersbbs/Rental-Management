import instance from './instance';

const productService = {
  // Get all products with optional filtering
  getAllProducts: async (params = {}) => {
    try {
      const response = await instance.get('/products', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products');
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    try {
      const response = await instance.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product');
    }
  },

  // Get product categories
  getCategories: async () => {
    try {
      const response = await instance.get('/products/categories');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Get low stock products
  getLowStockProducts: async () => {
    try {
      const response = await instance.get('/products/stock/low-stock');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch low stock products');
    }
  },

  // Get product statistics for reports
  getProductStats: async () => {
    try {
      const response = await instance.get('/products/stats').catch(async (error) => {
        if (error.response?.status === 404) {
          // If stats endpoint doesn't exist, fetch all products and calculate stats
          const productsResponse = await instance.get('/products');
          const products = Array.isArray(productsResponse.data) ?
            productsResponse.data :
            (productsResponse.data.products || []);
          return { data: productService.calculateStats(products) };
        }
        throw error; // Re-throw other errors
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching product stats:', error);
      // Return empty stats object to prevent page from crashing
      return {
        totalProducts: 0,
        totalStock: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        categories: {}
      };
    }
  },

  // Get product report with all products
  getProductReport: async () => {
    try {
      const response = await instance.get('/products/report');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product report');
    }
  },

  // Create new product
  createProduct: async (productData) => {
    try {
      const response = await instance.post('/products', productData);
      return response.data;
    } catch (error) {
      // Capture detailed validation errors if available
      const detailedError = error.response?.data?.errors
        ? `${error.response.data.message}: ${error.response.data.errors.join(', ')}`
        : (error.response?.data?.message || 'Failed to create product');
      throw new Error(detailedError);
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    try {
      const response = await instance.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      const detailedError = error.response?.data?.errors
        ? `${error.response.data.message}: ${error.response.data.errors.join(', ')}`
        : (error.response?.data?.message || 'Failed to update product');
      throw new Error(detailedError);
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    try {
      const response = await instance.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      const detailedError = error.response?.data?.errors
        ? `${error.response.data.message}: ${error.response.data.errors.join(', ')}`
        : (error.response?.data?.message || 'Failed to delete product');
      throw new Error(detailedError);
    }
  },

  // Calculate product statistics
  calculateStats: (products) => {
    if (!products || !Array.isArray(products)) {
      return {
        total: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
        categories: {},
        priceRanges: {}
      };
    }

    let total = products.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;
    let categories = {};
    let priceRanges = {};

    products.forEach(product => {
      const quantity = product.quantity || 0;
      const price = product.price || 0;

      // Calculate stock status
      const displayQuantity = product.unit === 'liter' ? (quantity / 1000) :
        product.unit === 'kilogram' ? (quantity / 1000) : quantity;

      if (displayQuantity === 0) {
        outOfStock++;
      } else if (displayQuantity <= 10) {
        lowStock++;
      } else {
        inStock++;
      }

      // Calculate total value
      totalValue += price * quantity;

      // Count categories
      const categoryName = product.category?.name || product.category || 'No Category';
      categories[categoryName] = (categories[categoryName] || 0) + 1;

      // Count price ranges
      let range;
      if (price < 100) range = 'Under ₹100';
      else if (price < 500) range = '₹100 - ₹499';
      else if (price < 1000) range = '₹500 - ₹999';
      else if (price < 5000) range = '₹1,000 - ₹4,999';
      else range = '₹5,000+';
      priceRanges[range] = (priceRanges[range] || 0) + 1;
    });

    return {
      total,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
      categories,
      priceRanges
    };
  }
};

export default productService;
