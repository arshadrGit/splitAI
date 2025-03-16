import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, store } from '../redux/store';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signOut } from '../redux/authSlice';
import { toggleTheme as toggleThemeAction, setTheme } from '../redux/themeSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme, isDark, toggleTheme } = useTheme();
  const reduxIsDark = useSelector((state: RootState) => state.theme.isDark);
  const user = useSelector((state: RootState) => state.auth.user);

  // Check AsyncStorage directly on mount
  useEffect(() => {
    const checkStorage = async () => {
      try {
        const themeData = await AsyncStorage.getItem('persist:theme');
        console.log('AsyncStorage theme data:', themeData);
        if (themeData) {
          const parsedData = JSON.parse(themeData);
          console.log('Parsed theme data:', parsedData);
          if (parsedData.isDark) {
            const isDarkValue = JSON.parse(parsedData.isDark);
            console.log('AsyncStorage isDark value:', isDarkValue);
          }
        }
      } catch (error) {
        console.error('Error reading AsyncStorage:', error);
      }
    };
    
    checkStorage();
  }, []);

  // Log theme state for debugging
  useEffect(() => {
    console.log('Theme Context isDark:', isDark);
    console.log('Redux Theme isDark:', reduxIsDark);
  }, [isDark, reduxIsDark]);

  // Handle theme toggle with both context and Redux
  const handleToggleTheme = () => {
    console.log('Toggling theme from:', isDark, 'to:', !isDark);
    
    // Update Redux first
    dispatch(toggleThemeAction());
    
    // Then update context
    toggleTheme();
    
    // Verify the change was applied
    setTimeout(() => {
      const currentReduxTheme = store.getState().theme.isDark;
      console.log('After toggle - Redux theme:', currentReduxTheme);
      
      // Force persist the state
      import('../redux/store').then(({ persistor }) => {
        persistor.flush().then(() => {
          console.log('State persisted after theme toggle');
        });
      });
    }, 100);
  };

  const settingsOptions = [
    {
      title: 'Profile',
      icon: 'account',
      onPress: () => navigation.navigate('EditProfile'),
      description: 'Edit your profile information'
    },
    {
      title: 'Dark Theme',
      icon: isDark ? 'weather-night' : 'white-balance-sunny',
      onPress: handleToggleTheme,
      description: 'Toggle dark/light theme',
      rightElement: (
        <Switch
          value={isDark}
          onValueChange={handleToggleTheme}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={isDark ? theme.colors.card : '#f4f3f4'}
        />
      )
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-check',
      onPress: () => navigation.navigate('PrivacyPolicy'),
      description: 'View our privacy policy'
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      onPress: () => navigation.navigate('HelpSupport'),
      description: 'Get help and contact support'
    },
    {
      title: 'About',
      icon: 'information',
      onPress: () => navigation.navigate('About'),
      description: 'Learn more about SplitEase'
    },
    {
      title: 'Sign Out',
      icon: 'logout',
      onPress: () => {
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Sign Out',
              style: 'destructive',
              onPress: () => dispatch(signOut())
            }
          ]
        );
      },
      description: 'Sign out of your account'
    }
  ];

  const renderSettingItem = ({ title, icon, onPress, description, rightElement }: any) => (
    <TouchableOpacity
      key={title}
      style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Icon name={icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.settingInfo}>
          <ThemeText variant="title" style={styles.settingTitle}>
            {title}
          </ThemeText>
          <ThemeText variant="caption" style={styles.settingDescription}>
            {description}
          </ThemeText>
        </View>
      </View>
      {rightElement || <Icon name="chevron-right" size={24} color={theme.colors.text} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Settings" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.profileInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <ThemeText style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </ThemeText>
            </View>
            <View>
              <ThemeText variant="title" style={styles.name}>
                {user?.displayName || 'User'}
              </ThemeText>
              <ThemeText variant="caption" style={styles.email}>
                {user?.email}
              </ThemeText>
            </View>
          </View>
        </View>

        <View style={styles.settingsList}>
          {settingsOptions.map(renderSettingItem)}
        </View>
       
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    opacity: 0.7,
  },
  settingsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    opacity: 0.7,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  debugButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default SettingsScreen; 