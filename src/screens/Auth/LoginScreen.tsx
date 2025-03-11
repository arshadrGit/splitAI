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
  Dimensions
} from 'react-native';
import { useDispatch } from 'react-redux';
import { signIn } from '../../redux/authSlice';
import { useTheme } from '../../themes/ThemeProvider';
import { ThemeText } from '../../components/ThemeText';
import { CustomButton } from '../../components/CustomButton';
import { Card } from '../../components/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const { theme } = useTheme();

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

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      await dispatch(signIn({ email, password })).unwrap();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
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
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.jpeg')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemeText variant="header" style={styles.appName}>SplitEase</ThemeText>
          <ThemeText style={styles.tagline}>Split bills, not friendships</ThemeText>
        </View>
        
        <Card style={styles.card} elevation={4}>
          <ThemeText variant="title" style={styles.title}>Welcome Back</ThemeText>
          
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

          <TouchableOpacity style={styles.forgotPassword}>
            <ThemeText style={{ color: theme.colors.primary }}>Forgot Password?</ThemeText>
          </TouchableOpacity>

          <CustomButton
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
            icon={<Icon name="login" size={20} color="#FFFFFF" />}
          />

          <View style={styles.footer}>
            <ThemeText>Don't have an account? </ThemeText>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <ThemeText style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Sign Up</ThemeText>
            </TouchableOpacity>
          </View>
        </Card>
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
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 16,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});

export default LoginScreen; 