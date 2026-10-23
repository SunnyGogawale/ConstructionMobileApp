import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { C } from "../shared/theme.js";
import { styles } from "../shared/styles.js";
import { API_URL } from "../shared/api.js";
export function LoginScreen({
  onLogin,
  error
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (forgotPassword) {
      Alert.alert("Password reset", "Contact your administrator to reset your account password.");
      return;
    }
    setSubmitting(true);
    await onLogin(email.trim(), password);
    setSubmitting(false);
  };
  return <SafeAreaView style={styles.loginScreen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.loginWrap}>
        <View style={styles.loginBrand}><View style={styles.brandMark}><MaterialCommunityIcons name="office-building" size={22} color={C.white} /></View><Text style={styles.loginBrandName}>BuildFlow</Text><Text style={styles.loginBrandCaption}>FIELD WORKSPACE</Text></View>
        <View style={styles.loginPanel}>
          <Text style={styles.eyebrow}>WORKER ACCESS</Text>
          <Text style={styles.loginTitle}>{forgotPassword ? "Reset your password" : "Welcome back"}</Text>
          <Text style={styles.bodyCopy}>{forgotPassword ? "Enter your account email and contact your team administrator." : "Sign in to view your assignments and site updates."}</Text>
          <Text style={styles.loginLabel}>EMAIL ADDRESS</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@company.com" style={styles.loginInput} />
          {!forgotPassword && <><Text style={styles.loginLabel}>PASSWORD</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Enter your password" style={styles.loginInput} /></>}
          {!!error && <Text style={styles.loginError}>{error}</Text>}
          {!API_URL && <Text style={styles.apiNotice}>Set EXPO_PUBLIC_API_URL to connect to your BuildFlow API.</Text>}
          <Pressable disabled={submitting} onPress={submit} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{submitting ? "Signing in…" : forgotPassword ? "Continue" : "Sign in"}</Text><MaterialCommunityIcons name="arrow-right" size={18} color={C.white} /></Pressable>
          <Pressable onPress={() => setForgotPassword(value => !value)} style={styles.forgotAction}><Text style={styles.orangeText}>{forgotPassword ? "Back to sign in" : "Forgot password?"}</Text></Pressable>
        </View>
        <Text style={styles.loginFooter}>Secure access for authorized field team members.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>;
}
