import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { signOut } from '../redux/authSlice';
import { useTheme, toggleTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { CustomButton } from '../components/CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const AccountScreen = () => {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await dispatch(signOut()).unwrap();
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const settings = [
    {
      id: 'darkMode',
      title: 'Dark Mode',
      description: 'Toggle between light and dark theme',
      icon: 'theme-light-dark',
      action: (
        <Switch
          value={theme.dark}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: theme.colors.primary }}
          thumbColor="#f4f3f4"
        />
      ),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: 'bell-outline',
      action: (
        <TouchableOpacity>
          <Icon name="chevron-right" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ),
    },
    {
      id: 'privacy',
      title: 'Privacy',
      description: 'Manage your privacy settings',
      icon: 'shield-outline',
      action: (
        <TouchableOpacity>
          <Icon name="chevron-right" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ),
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help or contact support',
      icon: 'help-circle-outline',
      action: (
        <TouchableOpacity>
          <Icon name="chevron-right" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ),
    },
    {
      id: 'about',
      title: 'About',
      description: 'Learn more about SplitEase',
      icon: 'information-outline',
      action: (
        <TouchableOpacity>
          <Icon name="chevron-right" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      ),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Account" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <ThemeText style={styles.profileInitial}>
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </ThemeText>
                </View>
              )}
              <View>
                <ThemeText variant="title" style={styles.profileName}>
                  {user?.displayName || 'User'}
                </ThemeText>
                <ThemeText variant="caption" style={styles.profileEmail}>
                  {user?.email}
                </ThemeText>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Icon name="pencil" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Settings */}
        <Card style={styles.settingsCard}>
          <ThemeText variant="title" style={styles.settingsTitle}>Settings</ThemeText>
          
          {settings.map((setting, index) => (
            <View key={setting.id} style={[
              styles.settingItem,
              index < settings.length - 1 && styles.settingItemBorder
            ]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: theme.colors.card }]}>
                  <Icon name={setting.icon} size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <ThemeText style={styles.settingTitle}>{setting.title}</ThemeText>
                  <ThemeText variant="caption">{setting.description}</ThemeText>
                </View>
              </View>
              {setting.action}
            </View>
          ))}
        </Card>
        
        {/* Sign Out Button */}
        <CustomButton
          title="Sign Out"
          onPress={handleSignOut}
          loading={loading}
          style={styles.signOutButton}
          variant="outline"
          icon={<Icon name="logout" size={20} color={theme.colors.error} />}
          textColor={theme.colors.error}
          borderColor={theme.colors.error}
        />
        
        <ThemeText variant="caption" style={styles.versionText}>
          Version 1.0.0
        </ThemeText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    opacity: 0.7,
  },
  editButton: {
    padding: 8,
  },
  settingsCard: {
    marginBottom: 16,
  },
  settingsTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontWeight: '500',
    marginBottom: 2,
  },
  signOutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  versionText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default AccountScreen; 