import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import inwardService from '../../../services/inwardService';

// Async thunks
export const createInward = createAsyncThunk(
  'inwards/create',
  async (inwardData, thunkAPI) => {
    try {
      return await inwardService.createInward(inwardData);
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getInwards = createAsyncThunk(
  'inwards/getAll',
  async (filters = {}, thunkAPI) => {
    try {
      return await inwardService.getInwards(filters);
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getInward = createAsyncThunk(
  'inwards/getOne',
  async (inwardId, thunkAPI) => {
    try {
      return await inwardService.getInward(inwardId);
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updateInward = createAsyncThunk(
  'inwards/update',
  async ({ inwardId, inwardData }, thunkAPI) => {
    try {
      return await inwardService.updateInward(inwardId, inwardData);
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deleteInward = createAsyncThunk(
  'inwards/delete',
  async (inwardId, thunkAPI) => {
    try {
      await inwardService.deleteInward(inwardId);
      return inwardId;
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const approveInward = createAsyncThunk(
  'inwards/approve',
  async (inwardId, thunkAPI) => {
    try {
      return await inwardService.approveInward(inwardId);
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const addToInventory = createAsyncThunk(
  'inwards/addToInventory',
  async (inwardId, thunkAPI) => {
    try {
      // Perform add to inventory
      await inwardService.addToInventory(inwardId);
      // Return the refreshed inward so reducers receive a full inward object
      const refreshed = await thunkAPI.dispatch(getInward(inwardId)).unwrap();
      return refreshed;
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const rejectInward = createAsyncThunk(
  'inwards/reject',
  async ({ inwardId, rejectionReason }, thunkAPI) => {
    try {
      return await inwardService.rejectInward(inwardId, rejectionReason);
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const completeInward = createAsyncThunk(
  'inwards/complete',
  async (inwardId, thunkAPI) => {
    try {
      return await inwardService.completeInward(inwardId);
    } catch (error) {
      const message = (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  inwards: [],
  inward: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  }
};

const inwardSlice = createSlice({
  name: 'inwards',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    clearInward: (state) => {
      state.inward = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Inward
      .addCase(createInward.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createInward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inwards.push(action.payload);
      })
      .addCase(createInward.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Inwards
      .addCase(getInwards.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInwards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        
        // Handle different response formats
        if (Array.isArray(action.payload)) {
          // If payload is directly an array
          state.inwards = action.payload;
        } 
        // Handle mongoose-paginate-v2 format (docs array with pagination info)
        else if (action.payload.docs && Array.isArray(action.payload.docs)) {
          state.inwards = action.payload.docs;
          // Store pagination info if available
          if (action.payload.totalDocs !== undefined) {
            state.pagination = {
              currentPage: action.payload.page || 1,
              totalPages: action.payload.totalPages || 1,
              totalItems: action.payload.totalDocs || 0,
              itemsPerPage: action.payload.limit || (action.payload.docs.length || 10)
            };
          }
        }
        // Handle response with data property
        else if (action.payload.data && Array.isArray(action.payload.data)) {
          state.inwards = action.payload.data;
        } 
        // Handle response with inwards property
        else if (action.payload.inwards && Array.isArray(action.payload.inwards)) {
          state.inwards = action.payload.inwards;
        } 
        // Fallback for other formats
        else {
          console.warn('Unexpected payload format in getInwards.fulfilled:', action.payload);
          state.inwards = [];
        }
        
        console.log('Inwards loaded:', state.inwards);
      })
      .addCase(getInwards.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Inward
      .addCase(getInward.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inward = action.payload;
      })
      .addCase(getInward.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Inward
      .addCase(updateInward.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateInward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inwards = state.inwards.map((inward) =>
          inward._id === action.payload._id ? action.payload : inward
        );
        state.inward = action.payload;
      })
      .addCase(updateInward.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete Inward
      .addCase(deleteInward.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteInward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inwards = state.inwards.filter(
          (inward) => inward._id !== action.payload
        );
      })
      .addCase(deleteInward.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Approve Inward
      .addCase(approveInward.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(approveInward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inwards = state.inwards.map((inward) =>
          inward._id === action.payload._id ? action.payload : inward
        );
        state.inward = action.payload;
      })
      .addCase(approveInward.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Reject Inward
      .addCase(rejectInward.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(rejectInward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inwards = state.inwards.map((inward) =>
          inward._id === action.payload._id ? action.payload : inward
        );
        state.inward = action.payload;
      })
      .addCase(rejectInward.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Complete Inward
      .addCase(completeInward.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeInward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inwards = state.inwards.map((inward) =>
          inward._id === action.payload._id ? action.payload : inward
        );
        state.inward = action.payload;
      })
      .addCase(completeInward.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add to Inventory
      .addCase(addToInventory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inward = action.payload;
        state.inwards = state.inwards.map((inward) =>
          inward._id === action.payload._id ? action.payload : inward
        );
      })
      .addCase(addToInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset, clearInward } = inwardSlice.actions;
export default inwardSlice.reducer;
