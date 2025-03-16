/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, persistor } from './src/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from './src/themes/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { checkAuthState } from './src/redux/authSlice';
import { RootState, AppDispatch } from './src/redux/store';
import { ActivityIndicator, View, Text } from 'react-native';

// Create a separate component to use hooks
const AppContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { initialized, loading } = useSelector((state: RootState) => state.auth);
  const { isDark } = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  // Log theme state whenever it changes
  useEffect(() => {
    console.log('Theme state changed in AppContent:', isDark);
  }, [isDark]);

  if (!initialized) {
    // Show loading indicator while checking auth state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF5A5F" />
      </View>
    );
  }

  console.log('Rendering AppContent with theme:', isDark);

  return (
    <ThemeProvider initialTheme={isDark}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

const LoadingView = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#FF5A5F" />
    <Text style={{ marginTop: 10 }}>Loading persisted state...</Text>
  </View>
);

const App = () => {
  console.log('Rendering App component');
  
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingView />} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
};

export default App;
