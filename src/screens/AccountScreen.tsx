import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { signOut } from '../redux/authSlice';
import { toggleTheme } from '../redux/themeSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';

export const AccountScreen = () => {
  const dispatch = useDispatch();
  const { theme, isDark } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSignOut = () => {
    dispatch(signOut());
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.profileCard}>
        <Image
          source={{ uri: user?.photoURL || 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />
        <ThemeText variant="title" style={styles.name}>
          {user?.displayName}
        </ThemeText>
        <ThemeText variant="caption" style={styles.email}>
          {user?.email}
        </ThemeText>
      </Card>

      <Card style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <ThemeText>Dark Mode</ThemeText>
          <CustomButton
            title={isDark ? 'On' : 'Off'}
            onPress={handleToggleTheme}
            variant="secondary"
          />
        </View>
      </Card>

      <CustomButton
        title="Sign Out"
        onPress={handleSignOut}
        variant="secondary"
        style={styles.signOutButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  profileCard: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    marginBottom: 8,
  },
  email: {
    marginBottom: 16,
  },
  settingsCard: {
    marginTop: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutButton: {
    marginTop: 20,
  },
});

export default AccountScreen; 