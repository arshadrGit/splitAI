import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface ThemeTextProps extends TextProps {
  variant?: 'header' | 'title' | 'body' | 'caption';
}

export const ThemeText: React.FC<ThemeTextProps> = ({ 
  children, 
  variant = 'body',
  style,
  ...props 
}) => {
  const { theme } = useTheme();

  return (
    <Text
      style={[
        styles[variant],
        { color: theme.colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 14,
    color: '#666',
  },
}); 