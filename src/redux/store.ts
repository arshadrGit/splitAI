import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import friendsReducer from './friendsSlice';
import groupsReducer from './groupsSlice';
import activityReducer from './activitySlice';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    friends: friendsReducer,
    groups: groupsReducer,
    activity: activityReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 