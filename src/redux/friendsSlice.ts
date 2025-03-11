import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { Friend } from '../types';

interface FriendsState {
  friends: Friend[];
  loading: boolean;
  error: string | null;
}

const initialState: FriendsState = {
  friends: [],
  loading: false,
  error: null,
};

export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (userId: string) => {
    const q = query(
      collection(db, 'friends'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friend));
  }
);

export const addFriend = createAsyncThunk(
  'friends/addFriend',
  async (friend: Omit<Friend, 'id'>) => {
    const docRef = await addDoc(collection(db, 'friends'), friend);
    return { id: docRef.id, ...friend };
  }
);

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch friends';
      })
      .addCase(addFriend.fulfilled, (state, action) => {
        state.friends.push(action.payload);
      });
  },
});

export default friendsSlice.reducer; 