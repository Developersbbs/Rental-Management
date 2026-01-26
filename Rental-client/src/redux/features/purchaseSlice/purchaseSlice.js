import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import purchaseService from '../../../services/purchaseService';

// Async thunks
export const createPurchase = createAsyncThunk(
  'purchases/create',
  async (purchaseData, thunkAPI) => {
    try {
      return await purchaseService.createPurchase(purchaseData);
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

export const getPurchases = createAsyncThunk(
  'purchases/getAll',
  async (filters = {}, thunkAPI) => {
    try {
      return await purchaseService.getPurchases(filters);
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

export const getPurchase = createAsyncThunk(
  'purchases/getOne',
  async (purchaseId, thunkAPI) => {
    try {
      return await purchaseService.getPurchase(purchaseId);
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

export const updatePurchase = createAsyncThunk(
  'purchases/update',
  async ({ purchaseId, purchaseData }, thunkAPI) => {
    try {
      return await purchaseService.updatePurchase(purchaseId, purchaseData);
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

export const deletePurchase = createAsyncThunk(
  'purchases/delete',
  async (purchaseId, thunkAPI) => {
    try {
      await purchaseService.deletePurchase(purchaseId);
      return purchaseId;
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

export const approvePurchase = createAsyncThunk(
  'purchases/approve',
  async (purchaseId, thunkAPI) => {
    try {
      return await purchaseService.approvePurchase(purchaseId);
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

export const rejectPurchase = createAsyncThunk(
  'purchases/reject',
  async ({ purchaseId, rejectionReason }, thunkAPI) => {
    try {
      return await purchaseService.rejectPurchase(purchaseId, rejectionReason);
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

export const receivePurchase = createAsyncThunk(
  'purchases/receive',
  async ({ purchaseId, receivedItems }, thunkAPI) => {
    try {
      return await purchaseService.receivePurchase(purchaseId, receivedItems);
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

export const addPayment = createAsyncThunk(
  'purchases/addPayment',
  async ({ purchaseId, paymentData }, thunkAPI) => {
    try {
      return await purchaseService.addPayment(purchaseId, paymentData);
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
  purchases: [],
  purchase: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: ''
};

const purchaseSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    clearPurchase: (state) => {
      state.purchase = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Purchase
      .addCase(createPurchase.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPurchase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.purchases.push(action.payload);
      })
      .addCase(createPurchase.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Purchases
      .addCase(getPurchases.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPurchases.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.purchases = action.payload.docs;
      })
      .addCase(getPurchases.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Purchase
      .addCase(getPurchase.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPurchase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.purchase = action.payload;
      })
      .addCase(getPurchase.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update Purchase
      .addCase(updatePurchase.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePurchase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.purchases = state.purchases.map(purchase =>
          purchase._id === action.payload._id ? action.payload : purchase
        );
        if (state.purchase && state.purchase._id === action.payload._id) {
          state.purchase = action.payload;
        }
      })
      .addCase(updatePurchase.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete Purchase
      .addCase(deletePurchase.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deletePurchase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.purchases = state.purchases.filter(
          purchase => purchase._id !== action.payload
        );
      })
      .addCase(deletePurchase.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Approve Purchase
      .addCase(approvePurchase.fulfilled, (state, action) => {
        state.purchases = state.purchases.map(purchase =>
          purchase._id === action.payload._id ? action.payload : purchase
        );
        if (state.purchase && state.purchase._id === action.payload._id) {
          state.purchase = action.payload;
        }
      })
      // Reject Purchase
      .addCase(rejectPurchase.fulfilled, (state, action) => {
        state.purchases = state.purchases.map(purchase =>
          purchase._id === action.payload._id ? action.payload : purchase
        );
        if (state.purchase && state.purchase._id === action.payload._id) {
          state.purchase = action.payload;
        }
      })
      // Receive Purchase
      .addCase(receivePurchase.fulfilled, (state, action) => {
        state.purchases = state.purchases.map(purchase =>
          purchase._id === action.payload._id ? action.payload : purchase
        );
        if (state.purchase && state.purchase._id === action.payload._id) {
          state.purchase = action.payload;
        }
        if (state.purchase && state.purchase._id === action.payload._id) {
          state.purchase = action.payload;
        }
      })
      // Add Payment
      .addCase(addPayment.fulfilled, (state, action) => {
        state.purchases = state.purchases.map(purchase =>
          purchase._id === action.payload._id ? action.payload : purchase
        );
        if (state.purchase && state.purchase._id === action.payload._id) {
          state.purchase = action.payload;
        }
      });
  }
});

export const { reset, clearPurchase } = purchaseSlice.actions;
export default purchaseSlice.reducer;
