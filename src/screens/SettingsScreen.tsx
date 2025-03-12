import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { signOut } from '../redux/authSlice';

export const SettingsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);

  const settingsOptions = [
    {
      title: 'Profile',
      icon: 'account',
      onPress: () => navigation.navigate('EditProfile'),
      description: 'Edit your profile information'
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

  const renderSettingItem = ({ title, icon, onPress, description }: any) => (
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
      <Icon name="chevron-right" size={24} color={theme.colors.text} />
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
});

export default SettingsScreen; 