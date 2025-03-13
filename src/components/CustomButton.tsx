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
  size?: 'small' | 'medium' | 'large';
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
  size = 'medium',
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

  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 56;
      case 'medium':
      default:
        return 48;
    }
  };

  const getButtonPadding = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 24;
      case 'medium':
      default:
        return 20;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      case 'medium':
      default:
        return 16;
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          height: getButtonHeight(),
          paddingHorizontal: getButtonPadding(),
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size={size === 'small' ? 'small' : 'small'} />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text, 
            { 
              color: getTextColor(),
              fontSize: getFontSize(),
              marginLeft: icon ? 8 : 0,
            },
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
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
}); 