import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from './ThemeText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface HeaderProps {
  title: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, {backgroundColor: theme.colors.background, shadowColor: theme.colors.primary, }]}>
      {leftIcon ? (
        <TouchableOpacity style={styles.iconButton} onPress={onLeftPress}>
          <Icon name={leftIcon} size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      <ThemeText variant="title" style={styles.title}>{title}</ThemeText>

      {rightIcon ? (
        <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
          <Icon name={rightIcon} size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 1,
    // shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    // color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 40,
  },
}); 