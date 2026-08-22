import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import BuildFlowLogo from '../components/BuildFlowLogo';

function SplashScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#0b1328" />
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View style={styles.content}>
        <BuildFlowLogo />
        <Text style={styles.brand}>BuildFlow</Text>
        <Text style={styles.subtitle}>ENTERPRISE CMS</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.tagline}>Construction Management Simplified</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1328',
    position: 'relative',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(36, 73, 155, 0.18)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -140,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(36, 73, 155, 0.14)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  brand: {
    marginTop: 26,
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    color: '#8f9bb8',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1.4,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 28,
  },
  tagline: {
    color: '#e2e8f4',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressTrack: {
    width: 128,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(161, 176, 206, 0.26)',
    overflow: 'hidden',
    marginBottom: 34,
  },
  progressFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#f8f8fb',
  },
});

export default SplashScreen;
