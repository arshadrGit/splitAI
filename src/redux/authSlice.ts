import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from '../services/firebase';
import { User } from '../types';
import firebase from '@react-native-firebase/app';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user?.updateProfile({ displayName });
    return {
      id: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: displayName,
      photoURL: userCredential.user.photoURL,
    };
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }) => {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return {
      id: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: userCredential.user.displayName!,
      photoURL: userCredential.user.photoURL,
    };
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async () => {
    await auth.signOut();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Sign up failed';
      })
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Sign in failed';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default authSlice.reducer; 