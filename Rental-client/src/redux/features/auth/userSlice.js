import {createSlice} from '@reduxjs/toolkit';

const userSlice=createSlice({
  name:'user',
  initialState:null,
  reducers:{
    setUser:(state,action)=>action.payload,
    clearUser:()=>null
  }
});

export const {setUser,clearUser}=userSlice.actions;
export const selectUser=state=>state.user;

export default userSlice.reducer;