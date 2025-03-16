import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer, 
  FLUSH, 
  REHYDRATE, 
  PAUSE, 
  PERSIST, 
  PURGE, 
  REGISTER,
  createMigrate
} from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './authSlice';
import friendsReducer from './friendsSlice';
import groupsReducer from './groupsSlice';
import expensesReducer from './expensesSlice';
import activityReducer from './activitySlice';
import themeReducer from './themeSlice';

// Define the ThemeState interface
interface ThemeState {
  isDark: boolean;
}

// Configure persist for theme
const themePersistConfig = {
  key: 'theme',
  storage: AsyncStorage,
  version: 1,
  debug: true,
  stateReconciler: autoMergeLevel2,
};

// Only persist the theme reducer
const persistedThemeReducer = persistReducer<ThemeState>(themePersistConfig, themeReducer);

const rootReducer = combineReducers({
  auth: authReducer,
  friends: friendsReducer,
  groups: groupsReducer,
  expenses: expensesReducer,
  activity: activityReducer,
  theme: persistedThemeReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [
          FLUSH, 
          REHYDRATE, 
          PAUSE, 
          PERSIST, 
          PURGE, 
          REGISTER,
          'auth/signIn/fulfilled', 
          'auth/signUp/fulfilled',
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.date', 'meta.arg.createdAt', 'meta.arg.date'],
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.user',
          'friends.friends',
          'friends.incomingRequests',
          'groups.groups',
          'groups.currentGroup',
          'expenses.expenses',
          'activity.activities',
        ],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store, null, () => {
  console.log('Rehydration completed');
  console.log('Current theme state:', store.getState().theme);
});

// Export for debugging
export const purgePersistedState = () => {
  return persistor.purge();
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 