import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface CardProps extends ViewProps {
  elevation?: number;
  outlined?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  elevation = 2,
  outlined = false,
  ...props 
}) => {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.card,
        { 
          backgroundColor: theme.colors.card,
          borderColor: outlined ? theme.colors.border : 'transparent',
          shadowOpacity: theme.dark ? 0.3 : 0.1,
          elevation: elevation,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    marginVertical: 8,
  },
}); 