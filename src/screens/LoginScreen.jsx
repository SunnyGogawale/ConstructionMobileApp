import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BuildFlowLogo from '../components/BuildFlowLogo';
import loginUser from '../services/authService';

function LoginScreen({onForgotPassword, onLoginSuccess}) {
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackTone, setFeedbackTone] = useState('neutral');

  const handleLogin = async () => {
    if (!mobileNumber.trim() || !password.trim()) {
      setFeedbackTone('error');
      setFeedbackMessage('Enter your mobile number and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMessage('');

      const response = await loginUser({
        mobileNumber: mobileNumber.trim(),
        password,
      });

      const user = response?.data?.user;
      const redirected = onLoginSuccess ? onLoginSuccess(user) : false;

      if (redirected) {
        return;
      }

      setFeedbackTone('error');
      setFeedbackMessage('Only Admin users can access the Admin Dashboard.');
      Alert.alert('Access limited', 'Only Admin users can access this screen.');
    } catch (error) {
      setFeedbackTone('error');
      setFeedbackMessage(error.message || 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fb" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <BuildFlowLogo variant="login" />
          <Text style={styles.brand}>BuildFlow</Text>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your construction suite</Text>

        <Text style={styles.fieldLabel}>Mobile Number</Text>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.textInput}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            placeholder="1234567890"
            placeholderTextColor="#9aa3b3"
            autoCapitalize="none"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
          />
        </View>

        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9aa3b3"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            textContentType="password"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowPassword(previous => !previous)}
            hitSlop={12}
            style={styles.eyeButton}>
            <View style={styles.eyeIcon}>
              <View style={styles.eyeOutline} />
              <View style={styles.eyePupil} />
              <View style={styles.eyeSlash} />
            </View>
          </Pressable>
        </View>

        <View style={styles.rowBetween}>
          <Pressable
            accessibilityRole="checkbox"
            onPress={() => setRememberMe(previous => !previous)}
            style={styles.checkboxRow}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe ? <View style={styles.checkboxTick} /> : null}
            </View>
            <Text style={styles.checkboxLabel}>Remember me</Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={onForgotPassword}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleLogin}
          disabled={isSubmitting}
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}>
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Text>
        </Pressable>

        {feedbackMessage ? (
          <Text
            style={[
              styles.feedbackMessage,
              feedbackTone === 'success'
                ? styles.feedbackSuccess
                : styles.feedbackError,
            ]}>
            {feedbackMessage}
          </Text>
        ) : null}

        <Pressable accessibilityRole="button" style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Create New Account</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 46,
    paddingBottom: 32,
  },
  keyboardView: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: {
    color: '#172033',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  title: {
    marginTop: 6,
    color: '#172033',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 4,
    color: '#667085',
    fontSize: 15,
    lineHeight: 21,
  },
  fieldLabel: {
    marginTop: 22,
    marginBottom: 8,
    color: '#172033',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9dfeb',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: '#172033',
    fontSize: 16,
    lineHeight: 20,
    padding: 0,
  },
  eyeButton: {
    marginLeft: 10,
  },
  eyeIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eyeOutline: {
    width: 18,
    height: 10,
    borderWidth: 1.6,
    borderColor: '#6f7785',
    borderRadius: 9,
  },
  eyePupil: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6f7785',
  },
  eyeSlash: {
    position: 'absolute',
    width: 18,
    height: 1.8,
    backgroundColor: '#6f7785',
    transform: [{rotate: '-35deg'}],
  },
  rowBetween: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#2d6cdf',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2d6cdf',
  },
  checkboxTick: {
    width: 6,
    height: 3,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ffffff',
    transform: [{rotate: '-45deg'}],
    marginTop: -1,
  },
  checkboxLabel: {
    color: '#5e6980',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  forgotPassword: {
    color: '#2d6cdf',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 22,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#2d6cdf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  feedbackMessage: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  feedbackSuccess: {
    color: '#137333',
  },
  feedbackError: {
    color: '#b42318',
  },
  secondaryButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe2ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#172033',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
});

export default LoginScreen;
