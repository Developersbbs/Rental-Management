import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../services/instance';

// Initial state
const initialState = {
  items: [],
  categories: [],
  lowStockProducts: [],
  pagination: { page: 1, limit: 50, total: 0, pages: 0 },
  loading: false,
  error: null,
  success: false
};

// Helper to get auth config
const getAuthConfig = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// --- Async Thunks ---

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux fetchProducts: Starting fetch...');
      console.log('🔄 Redux fetchProducts: Params:', params);

      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 50,
        ...(params.search && { search: params.search }),
        ...(params.category && params.category !== 'all' && { category: params.category }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder }),
        ...(params.stockStatus && { stockStatus: params.stockStatus })
      });

      console.log('🔄 Redux fetchProducts: Query params:', queryParams.toString());

      // Using the configured axiosInstance which has withCredentials: true
      const response = await axiosInstance.get(`/products?${queryParams}`);
      console.log('🔄 Redux fetchProducts: Response received:', response.data);

      return response.data;
    } catch (error) {
      console.error('🔄 Redux fetchProducts: Error:', error);
      
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('🔄 Redux fetchProducts: Error response data:', error.response.data);
        console.error('🔄 Redux fetchProducts: Error status:', error.response.status);
        
        if (error.response.status === 401) {
          // Unauthorized - token might be expired or invalid
          return rejectWithValue('Your session has expired. Please log in again.');
        } else if (error.response.status === 403) {
          // Forbidden - user doesn't have permission
          return rejectWithValue('You do not have permission to access this resource.');
        } else if (error.response.status === 404) {
          // Not found
          return rejectWithValue('The requested resource was not found.');
        } else if (error.response.status >= 500) {
          // Server error
          return rejectWithValue('A server error occurred. Please try again later.');
        }
        
        // For other 4xx errors, use the server's error message if available
        return rejectWithValue(
          error.response.data?.message || 'Failed to fetch products. Please try again.'
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error('🔄 Redux fetchProducts: No response received:', error.request);
        return rejectWithValue('Unable to connect to the server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('🔄 Redux fetchProducts: Request setup error:', error.message);
        return rejectWithValue('An error occurred while processing your request.');
      }
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      // Ensure manufacturing date is formatted correctly
      const formattedProductData = {
        ...productData,
        manufacturingDate: productData.manufacturingDate 
          ? new Date(productData.manufacturingDate).toISOString() 
          : null,
      };

      console.log('Redux createProduct - Sending data:', formattedProductData);
      
      // Using the configured axiosInstance which has withCredentials: true
      const response = await axiosInstance.post("/products", formattedProductData);
      
      console.log('Redux createProduct - Success response:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Redux createProduct - Error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Redux createProduct - Error response data:', error.response.data);
        console.error('Redux createProduct - Error status:', error.response.status);
        
        // Handle specific error statuses
        if (error.response.status === 400) {
          // Bad request - validation errors
          const errorMessage = error.response.data?.message || 'Invalid product data';
          const validationErrors = error.response.data?.errors;
          
          if (validationErrors) {
            // Format validation errors into a single message
            const errorDetails = Object.entries(validationErrors)
              .map(([field, message]) => `${field}: ${message}`)
              .join('; ');
            return rejectWithValue(`Validation failed: ${errorDetails}`);
          }
          return rejectWithValue(errorMessage);
          
        } else if (error.response.status === 401) {
          // Unauthorized - token might be expired or invalid
          return rejectWithValue('Your session has expired. Please log in again.');
          
        } else if (error.response.status === 403) {
          // Forbidden - user doesn't have permission
          return rejectWithValue('You do not have permission to create products.');
          
        } else if (error.response.status >= 500) {
          // Server error
          return rejectWithValue('A server error occurred while creating the product. Please try again later.');
        }
        
        // For other 4xx errors, use the server's error message if available
        return rejectWithValue(
          error.response.data?.message || 'Failed to create product. Please try again.'
        );
        
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Redux createProduct - No response received:', error.request);
        return rejectWithValue('Unable to connect to the server. Please check your internet connection.');
        
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Redux createProduct - Request setup error:', error.message);
        return rejectWithValue('An error occurred while setting up the request to create the product.');
      }
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      // Format the product data for the API
      const formattedProductData = {
        ...productData,
        manufacturingDate: productData.manufacturingDate 
          ? new Date(productData.manufacturingDate).toISOString() 
          : null,
      };

      console.log('Redux updateProduct - Updating product ID:', id);
      console.log('Redux updateProduct - Update data:', formattedProductData);
      
      // Using the configured axiosInstance which has withCredentials: true
      const response = await axiosInstance.put(`/products/${id}`, formattedProductData);
      
      console.log('Redux updateProduct - Update successful:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Redux updateProduct - Error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Redux updateProduct - Error response data:', error.response.data);
        console.error('Redux updateProduct - Error status:', error.response.status);
        
        // Handle specific error statuses
        if (error.response.status === 400) {
          // Bad request - validation errors
          const errorMessage = error.response.data?.message || 'Invalid product data';
          const validationErrors = error.response.data?.errors;
          
          if (validationErrors) {
            // Format validation errors into a single message
            const errorDetails = Object.entries(validationErrors)
              .map(([field, message]) => `${field}: ${message}`)
              .join('; ');
            return rejectWithValue(`Validation failed: ${errorDetails}`);
          }
          return rejectWithValue(errorMessage);
          
        } else if (error.response.status === 401) {
          // Unauthorized - token might be expired or invalid
          return rejectWithValue('Your session has expired. Please log in again.');
          
        } else if (error.response.status === 403) {
          // Forbidden - user doesn't have permission
          return rejectWithValue('You do not have permission to update this product.');
          
        } else if (error.response.status === 404) {
          // Not found
          return rejectWithValue('The product you are trying to update was not found.');
          
        } else if (error.response.status >= 500) {
          // Server error
          return rejectWithValue('A server error occurred while updating the product. Please try again later.');
        }
        
        // For other 4xx errors, use the server's error message if available
        return rejectWithValue(
          error.response.data?.message || 'Failed to update product. Please try again.'
        );
        
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Redux updateProduct - No response received:', error.request);
        return rejectWithValue('Unable to connect to the server. Please check your internet connection.');
        
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Redux updateProduct - Request setup error:', error.message);
        return rejectWithValue('An error occurred while setting up the request to update the product.');
      }
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      console.log('Redux deleteProduct - Deleting product ID:', id);
      
      // Using the configured axiosInstance which has withCredentials: true
      await axiosInstance.delete(`/products/${id}`);
      
      console.log('Redux deleteProduct - Delete successful');
      return id; // Return the deleted product ID
      
      await axios.delete(`${API_BASE_URL}/api/products/${id}`, getAuthConfig(token));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

// --- Slice Definition ---

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.success = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProduct.pending, (state) => { state.loading = true; })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.items.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProduct.pending, (state) => { state.loading = true; })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.items.findIndex(p => p._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteProduct.pending, (state) => { state.loading = true; })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.items = state.items.filter(p => p._id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearSuccess } = productSlice.actions;
export default productSlice.reducer;