import { createSlice } from "@reduxjs/toolkit";

export const registerSlice = createSlice({
  name: "register",
  initialState: {
    form: {
      username: "",
      email: "",
      password: "",
    },
  },
  reducers: {
    setUsername: (state, action) => {
      state.form.username = action.payload;
    },
    setEmail: (state, action) => {
      state.form.email = action.payload;
    },
    setPassword: (state, action) => {
      state.form.password = action.payload;
    },
  },
});

export const { setUsername, setEmail, setPassword } = registerSlice.actions;

export const selectUsername = (state) => state.register.form.username;
export const selectEmail = (state) => state.register.form.email;
export const selectPassword = (state) => state.register.form.password;

export default registerSlice.reducer;
