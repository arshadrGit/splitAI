import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../services/firebase';
import { collection, getDocs, addDoc, query, orderBy, where } from 'firebase/firestore';
import { Activity } from '../types';

interface ActivityState {
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  activities: [],
  loading: false,
  error: null,
};

export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async (userId: string) => {
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
  }
);

export const addActivity = createAsyncThunk(
  'activity/addActivity',
  async (activity: Omit<Activity, 'id'>) => {
    const docRef = await addDoc(collection(db, 'activities'), activity);
    return { id: docRef.id, ...activity };
  }
);

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activities';
      })
      .addCase(addActivity.fulfilled, (state, action) => {
        state.activities.unshift(action.payload);
      });
  },
});

export default activitySlice.reducer; 