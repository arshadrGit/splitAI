import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ImageBackground,
  Image,
  ScrollView
} from 'react-native';
import { useDispatch } from 'react-redux';
import { signUp } from '../../redux/authSlice';
import { useTheme } from '../../themes/ThemeProvider';
import { ThemeText } from '../../components/ThemeText';
import { CustomButton } from '../../components/CustomButton';
import { Card } from '../../components/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const SignupScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPwd: string) => {
    if (!confirmPwd) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    } else if (confirmPwd !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSignup = async () => {
    const isNameValid = validateName(displayName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      await dispatch(signUp({ email, password, displayName })).unwrap();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
    source={require('../../assets/images/background.jpeg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.jpeg')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemeText variant="header" style={styles.appName}>SplitEase</ThemeText>
          </View>
          
          <Card style={styles.card} elevation={4}>
            <ThemeText variant="title" style={styles.title}>Create Account</ThemeText>
            
            <View style={styles.inputContainer}>
              <Icon name="account-outline" size={20} color={theme.colors.text} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text,
                  borderColor: nameError ? theme.colors.error : theme.colors.border,
                }]}
                placeholder="Full Name"
                placeholderTextColor={theme.colors.placeholder}
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (nameError) validateName(text);
                }}
                onBlur={() => validateName(displayName)}
              />
            </View>
            {nameError ? <ThemeText style={styles.errorText}>{nameError}</ThemeText> : null}
            
            <View style={styles.inputContainer}>
              <Icon name="email-outline" size={20} color={theme.colors.text} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text,
                  borderColor: emailError ? theme.colors.error : theme.colors.border,
                }]}
                placeholder="Email"
                placeholderTextColor={theme.colors.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                onBlur={() => validateEmail(email)}
              />
            </View>
            {emailError ? <ThemeText style={styles.errorText}>{emailError}</ThemeText> : null}
            
            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={20} color={theme.colors.text} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text,
                  borderColor: passwordError ? theme.colors.error : theme.colors.border,
                }]}
                placeholder="Password"
                placeholderTextColor={theme.colors.placeholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                }}
                secureTextEntry={!showPassword}
                onBlur={() => validatePassword(password)}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={theme.colors.text} 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <ThemeText style={styles.errorText}>{passwordError}</ThemeText> : null}
            
            <View style={styles.inputContainer}>
              <Icon name="lock-check-outline" size={20} color={theme.colors.text} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text,
                  borderColor: confirmPasswordError ? theme.colors.error : theme.colors.border,
                }]}
                placeholder="Confirm Password"
                placeholderTextColor={theme.colors.placeholder}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) validateConfirmPassword(text);
                }}
                secureTextEntry={!showConfirmPassword}
                onBlur={() => validateConfirmPassword(confirmPassword)}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={theme.colors.text} 
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? <ThemeText style={styles.errorText}>{confirmPasswordError}</ThemeText> : null}

            <CustomButton
              title="Sign Up"
              onPress={handleSignup}
              loading={loading}
              style={styles.button}
              icon={<Icon name="account-plus" size={20} color="#FFFFFF" />}
            />

            <View style={styles.footer}>
              <ThemeText>Already have an account? </ThemeText>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <ThemeText style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Login</ThemeText>
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    padding: 20,
    // backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 30,
  },
  button: {
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});

export default SignupScreen; 