import { configureStore } from "@reduxjs/toolkit";
import registerReducer from '@/redux/features/auth/registerSlice';
import loginReducer from '@/redux/features/auth/loginSlice';
import userReducer from '@/redux/features/auth/userSlice';
import productReducer from '@/redux/features/products/productSlice';
import purchaseReducer from '@/redux/features/purchaseSlice/purchaseSlice';
import inwardReducer from '@/redux/features/inwardSlice/inwardSlice';

const store = configureStore({
  reducer: {
    register: registerReducer,
    login: loginReducer,
    user: userReducer,
    products: productReducer,
    purchases: purchaseReducer,
    inwards: inwardReducer,
  },
   middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: import.meta.env.MODE !== "production"


});

export default store;   // ✅ default export
