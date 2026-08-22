import React from 'react';
import {Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';

function ForgotPasswordScreen({onBack}) {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fb" />

      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backLinkRow}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLinkText}>Back to Sign In</Text>
        </Pressable>

        <View style={styles.iconCard}>
          <View style={styles.lockBase}>
            <View style={styles.lockShackle} />
            <View style={styles.lockBody} />
          </View>
        </View>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.description}>
          Enter your registered work email address. We&apos;ll send a secure
          validation link to reset your workspace access.
        </Text>

        <Text style={styles.fieldLabel}>Workspace Email</Text>
        <View style={styles.inputShell}>
          <TextInput
            style={styles.textInput}
            defaultValue=""
            placeholder="corporate@buildflow.com"
            placeholderTextColor="#9aa3b3"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
        </View>

        <Pressable accessibilityRole="button" style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  backArrow: {
    color: '#2d6cdf',
    fontSize: 28,
    lineHeight: 28,
    marginRight: 2,
    marginTop: -2,
  },
  backLinkText: {
    color: '#2d6cdf',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  iconCard: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff1c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  lockBase: {
    width: 22,
    height: 22,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#f08a00',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lockBody: {
    position: 'absolute',
    bottom: 1,
    width: 14,
    height: 12,
    borderWidth: 2,
    borderColor: '#f08a00',
    borderRadius: 4,
  },
  title: {
    color: '#172033',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  description: {
    color: '#667085',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  fieldLabel: {
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
  primaryButton: {
    marginTop: 22,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#2d6cdf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
