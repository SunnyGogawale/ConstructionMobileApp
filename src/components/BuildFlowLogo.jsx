import React from 'react';
import {StyleSheet, View} from 'react-native';

function BuildFlowLogo({variant = 'splash'}) {
  if (variant === 'login') {
    return (
      <View style={styles.loginLogo}>
        <View style={styles.loginLogoArm} />
        <View style={styles.loginLogoHead} />
        <View style={styles.loginLogoBody} />
      </View>
    );
  }

  return (
    <View style={styles.splashLogoCard}>
      <View style={styles.splashLogoIcon}>
        <View style={styles.splashLogoLineVertical} />
        <View style={styles.splashLogoLineHorizontal} />
        <View style={[styles.splashLogoNode, styles.splashLogoNodeTop]} />
        <View style={[styles.splashLogoNode, styles.splashLogoNodeLeft]} />
        <View style={[styles.splashLogoNode, styles.splashLogoNodeRight]} />
        <View style={[styles.splashLogoNode, styles.splashLogoNodeBottom]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashLogoCard: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#3f74ea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d2a6f',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
  },
  splashLogoIcon: {
    width: 38,
    height: 38,
    position: 'relative',
  },
  splashLogoLineVertical: {
    position: 'absolute',
    left: 6,
    top: 2,
    width: 2.5,
    height: 28,
    borderRadius: 2,
    backgroundColor: '#f5f8ff',
  },
  splashLogoLineHorizontal: {
    position: 'absolute',
    left: 6,
    bottom: 4,
    width: 24,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#f5f8ff',
  },
  splashLogoNode: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 2,
    borderColor: '#f5f8ff',
    backgroundColor: '#3f74ea',
  },
  splashLogoNodeTop: {
    top: 0,
    right: 1,
  },
  splashLogoNodeLeft: {
    top: 15,
    right: 11,
  },
  splashLogoNodeRight: {
    top: 9,
    right: 0,
  },
  splashLogoNodeBottom: {
    top: 24,
    right: 14,
  },
  loginLogo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#3369e8',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loginLogoArm: {
    position: 'absolute',
    left: 10,
    top: 8,
    width: 11,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ffffff',
    transform: [{rotate: '-45deg'}],
  },
  loginLogoHead: {
    position: 'absolute',
    left: 15,
    top: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3369e8',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  loginLogoBody: {
    position: 'absolute',
    right: 9,
    bottom: 8,
    width: 11,
    height: 11,
    borderRadius: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#ffffff',
    transform: [{rotate: '0deg'}],
  },
});

export default BuildFlowLogo;
