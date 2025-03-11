import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface CardProps extends ViewProps {
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, elevation = 2, ...props }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          elevation: elevation,
          shadowOpacity: elevation * 0.1,
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
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 3.84,
  },
}); 