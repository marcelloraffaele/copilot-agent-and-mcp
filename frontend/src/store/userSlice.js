import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null,
  userType: localStorage.getItem('userType') || null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.userType = action.payload.userType || null;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username);
      if (action.payload.userType) {
        localStorage.setItem('userType', action.payload.userType);
      } else {
        localStorage.removeItem('userType');
      }
    },
    logout(state) {
      state.token = null;
      state.username = null;
      state.userType = null;
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userType');
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
