import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../themes/ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const { theme } = useTheme();
  
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.disabled;
    
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return '#999';
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
        return theme.colors.primary;
      default:
        return '#FFFFFF';
    }
  };
  
  const getBorderColor = () => {
    if (variant === 'outline') {
      return theme.colors.primary;
    }
    return 'transparent';
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text, 
            { color: getTextColor() },
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 