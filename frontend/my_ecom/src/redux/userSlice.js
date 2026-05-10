import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../services/authService';
import { connectSocket, disconnectSocket } from '../socket/socket';

// ─── Thunks ────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk('user/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const data = await authService.login(email, password);
    connectSocket(data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('user/register', async ({ name, email, password }, { rejectWithValue }) => {
  try {
    const data = await authService.register(name, email, password);
    connectSocket(data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});

export const loginWithGoogle = createAsyncThunk('user/googleLogin', async (googleData, { rejectWithValue }) => {
  try {
    const data = await authService.loginWithGoogle(googleData);
    connectSocket(data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Google login failed');
  }
});

export const fetchProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    return await authService.getProfile();
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch profile');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: authService.getCurrentUser(),
    token: authService.getToken(),
    loading: false,
    error: null,
    notifications: [],
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      authService.logout();
      disconnectSocket();
    },
    clearError(state) {
      state.error = null;
    },
    addNotification(state, action) {
      state.notifications.push({ id: Date.now(), ...action.payload });
      // Keep only last 5
      if (state.notifications.length > 5) state.notifications.shift();
    },
    dismissNotification(state, action) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; state.error = null; };
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    };
    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, handleFulfilled)
      .addCase(loginUser.rejected, handleRejected)
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, handleFulfilled)
      .addCase(registerUser.rejected, handleRejected)
      .addCase(loginWithGoogle.pending, handlePending)
      .addCase(loginWithGoogle.fulfilled, handleFulfilled)
      .addCase(loginWithGoogle.rejected, handleRejected)
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      });
  },
});

export const { logout, clearError, addNotification, dismissNotification } = userSlice.actions;

export const selectUser = (state) => state.user.user;
export const selectToken = (state) => state.user.token;
export const selectIsAuth = (state) => !!state.user.token;
export const selectIsAdmin = (state) => state.user.user?.role === 'admin';
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
export const selectNotifications = (state) => state.user.notifications;

export default userSlice.reducer;
