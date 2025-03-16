import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { Theme } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '../redux/themeSlice';
import { RootState } from '../redux/store';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  toggleTheme: () => {},
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme }) => {
  const deviceTheme = useColorScheme();
  const dispatch = useDispatch();
  
  console.log('ThemeProvider initialTheme:', initialTheme);
  
  // Use initialTheme from Redux if provided, otherwise use device theme
  const [isDark, setIsDark] = useState(() => {
    // Log the initial theme value for debugging
    console.log('Setting initial theme state:', {
      initialTheme,
      deviceTheme,
      usingValue: initialTheme !== undefined ? initialTheme : deviceTheme === 'dark'
    });
    
    return initialTheme !== undefined ? initialTheme : deviceTheme === 'dark';
  });
  
  // Update local state when initialTheme changes
  useEffect(() => {
    console.log('initialTheme changed:', initialTheme);
    if (initialTheme !== undefined && initialTheme !== isDark) {
      console.log('Updating isDark to:', initialTheme);
      setIsDark(initialTheme);
    }
  }, [initialTheme]);
  
  const toggleTheme = () => {
    const newThemeValue = !isDark;
    console.log('Toggling theme to:', newThemeValue);
    setIsDark(newThemeValue);
    dispatch(setTheme(newThemeValue));
  };
  
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}; 