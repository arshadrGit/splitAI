import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
};

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
    // Create the user in Firebase Authentication
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    await userCredential.user?.updateProfile({ displayName });
    
    // Create a corresponding document in the users collection
    const userData = {
      email: userCredential.user.email,
      displayName: displayName,
      photoURL: userCredential.user.photoURL,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    
    // Use the auth UID as the document ID in Firestore
    await firestore()
      .collection('users')
      .doc(userCredential.user.uid)
      .set(userData);
    
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
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    
    // Check if user exists in Firestore, if not create it
    const userDoc = await firestore()
      .collection('users')
      .doc(userCredential.user.uid)
      .get();
    
    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await firestore()
        .collection('users')
        .doc(userCredential.user.uid)
        .set({
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
    }
    
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
  async (_, { rejectWithValue }) => {
    try {
      await auth().signOut();
      return null;
    } catch (error: any) {
      console.error('Sign out error:', error);
      return rejectWithValue(error.message || 'Failed to sign out');
    }
  }
);

export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async () => {
    return new Promise<User | null>((resolve) => {
      const unsubscribe = auth().onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          resolve({
            id: user.uid,
            email: user.email!,
            displayName: user.displayName || '',
            photoURL: user.photoURL,
          });
        } else {
          resolve(null);
        }
      });
    });
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
        state.loading = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkAuthState.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to check auth state';
        state.initialized = true;
      });
  },
});

export default authSlice.reducer; 