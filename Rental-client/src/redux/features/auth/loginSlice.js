import { createSlice } from "@reduxjs/toolkit"

export const loginSlice = createSlice({
  name: "login",
  initialState: {
    form: {
      email: "",
      password: "",
    },
    user: null, // 👈 user info
    token: null, // 👈 jwt token
  },
  reducers: {
    setEmail: (state, action) => {
      state.form.email = action.payload
    },
    setPassword: (state, action) => {
      state.form.password = action.payload
    },
    setUser: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.form = { email: "", password: "" }
      localStorage.removeItem("user")
      localStorage.removeItem("token")
    },
  },
})

export const { setEmail, setPassword, setUser, logout } = loginSlice.actions

export const selectEmail = (state) => state.login.form.email
export const selectPassword = (state) => state.login.form.password
export const selectUser = (state) => state.login.user
export const selectToken = (state) => state.login.token

export default loginSlice.reducer
