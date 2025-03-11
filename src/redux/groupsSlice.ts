import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { Group } from '../types';

interface GroupsState {
  groups: Group[];
  loading: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  groups: [],
  loading: false,
  error: null,
};

export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (userId: string) => {
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
  }
);

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (group: Omit<Group, 'id'>) => {
    const docRef = await addDoc(collection(db, 'groups'), group);
    return { id: docRef.id, ...group };
  }
);

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch groups';
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.push(action.payload);
      });
  },
});

export default groupsSlice.reducer; 