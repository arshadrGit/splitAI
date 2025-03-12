import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { updateProfile } from '../redux/authSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const EditProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    setLoading(true);
    try {
      await dispatch(updateProfile({ displayName })).unwrap();
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Edit Profile"
        leftIcon="arrow-left"
        onLeftPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
          <ThemeText style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </ThemeText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemeText style={styles.label}>Display Name</ThemeText>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemeText style={styles.label}>Email</ThemeText>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={user?.email}
              editable={false}
              placeholder="Your email"
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>

          <CustomButton
            title="Update Profile"
            onPress={handleUpdateProfile}
            loading={loading}
            style={styles.updateButton}
            icon={<Icon name="check" size={20} color="#FFFFFF" />}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  updateButton: {
    marginTop: 24,
  },
});

export default EditProfileScreen; 