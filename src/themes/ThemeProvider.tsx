import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { Theme } from '../types';

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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceTheme === 'dark');
  
  // Update theme when device theme changes
  useEffect(() => {
    setIsDark(deviceTheme === 'dark');
  }, [deviceTheme]);
  
  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };
  
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}; 