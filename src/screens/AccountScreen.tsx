import React from 'react';
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
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { CustomButton } from '../components/CustomButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const AccountScreen = () => {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            try {
              await dispatch(signOut());
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string, 
    title: string, 
    subtitle?: string, 
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => {
    return (
      <TouchableOpacity 
        style={styles.settingItem} 
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <Icon name={icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.settingContent}>
          <ThemeText style={styles.settingTitle}>{title}</ThemeText>
          {subtitle && <ThemeText variant="caption">{subtitle}</ThemeText>}
        </View>
        {rightElement || (
          onPress && <Icon name="chevron-right" size={20} color={theme.colors.text} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Account" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <ThemeText style={styles.profileInitial}>
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </ThemeText>
                </View>
              )}
              <View>
                <ThemeText variant="title" style={styles.profileName}>
                  {user?.displayName || 'User'}
                </ThemeText>
                <ThemeText variant="caption">{user?.email}</ThemeText>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Icon name="pencil" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <Card style={styles.settingsCard}>
          <ThemeText variant="title" style={styles.sectionTitle}>Settings</ThemeText>
          
          {renderSettingItem(
            'bell-outline', 
            'Notifications', 
            'Manage your notification preferences',
            undefined,
            () => Alert.alert('Coming Soon', 'Notification settings will be available soon!')
          )}
          
          {renderSettingItem(
            'credit-card-outline', 
            'Payment Methods', 
            'Add or remove payment methods',
            undefined,
            () => Alert.alert('Coming Soon', 'Payment method settings will be available soon!')
          )}
          
          {renderSettingItem(
            'theme-light-dark', 
            'Dark Mode', 
            'Toggle between light and dark theme',
            <Switch
              value={theme.dark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D1D6', true: `${theme.colors.primary}80` }}
              thumbColor={theme.colors.primary}
            />
          )}
          
          {renderSettingItem(
            'shield-account-outline', 
            'Privacy', 
            'Manage your privacy settings',
            undefined,
            () => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')
          )}
        </Card>

        <Card style={styles.settingsCard}>
          <ThemeText variant="title" style={styles.sectionTitle}>Support</ThemeText>
          
          {renderSettingItem(
            'help-circle-outline', 
            'Help Center', 
            'Get help with using the app',
            undefined,
            () => Alert.alert('Coming Soon', 'Help center will be available soon!')
          )}
          
          {renderSettingItem(
            'email-outline', 
            'Contact Us', 
            'Send us your feedback',
            undefined,
            () => Alert.alert('Coming Soon', 'Contact form will be available soon!')
          )}
        </Card>

        <CustomButton
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          style={styles.signOutButton}
          icon={<Icon name="logout" size={20} color={theme.colors.primary} />}
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
    fontSize: 18,
    marginBottom: 4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
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