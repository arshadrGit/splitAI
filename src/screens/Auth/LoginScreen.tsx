import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { useDispatch } from 'react-redux';
import { signIn } from '../../redux/authSlice';
import { useTheme } from '../../themes/ThemeProvider';
import { ThemeText } from '../../components/ThemeText';
import { CustomButton } from '../../components/CustomButton';
import { Card } from '../../components/Card';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={styles.card}>
        <ThemeText variant="header" style={styles.title}>Welcome Back</ThemeText>
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          }]}
          placeholder="Email"
          placeholderTextColor={theme.colors.text}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          }]}
          placeholder="Password"
          placeholderTextColor={theme.colors.text}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <CustomButton
          title="Login"
          onPress={handleLogin}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.footer}>
          <ThemeText>Don't have an account? </ThemeText>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <ThemeText style={{ color: theme.colors.primary }}>Sign Up</ThemeText>
          </TouchableOpacity>
        </View>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
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