import React from 'react';
import { Text, StyleSheet, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface ThemeTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'button';
  color?: string;
}

export const ThemeText: React.FC<ThemeTextProps> = ({
  children,
  style,
  variant = 'body',
  color,
  ...props
}) => {
  const { theme } = useTheme();
  
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'caption':
        return styles.caption;
      case 'button':
        return styles.button;
      case 'body':
      default:
        return styles.body;
    }
  };
  
  return (
    <Text
      style={[
        getVariantStyle(),
        { color: color || theme.colors.text },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  body: {
    fontSize: 14,
  },
  caption: {
    fontSize: 12,
    opacity: 0.7,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 