import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    clearCredentials(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUser(state, action) {
      state.user = {...state.user, ...action.payload};
    },
  },
});

export const {setCredentials, clearCredentials, updateUser} = authSlice.actions;

export const selectCurrentUser = state => state.auth.user;
export const selectToken = state => state.auth.token;
export const selectIsAuthenticated = state => state.auth.isAuthenticated;
export const selectUserRole = state => state.auth.user?.role;

export default authSlice.reducer;
