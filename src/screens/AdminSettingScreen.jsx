import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
// import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const {width: screenWidth} = Dimensions.get('window');
const scaleFactor = Math.min(screenWidth / 390, 1);
const fs = size => Math.round(size * scaleFactor);

const globalSettings = [
  {
    id: 'account',
    icon: 'user',
    title: 'Corporate Account',
    subtitle: 'Manage billing & details',
    iconColor: '#2f66ef',
  },
  {
    id: 'notifications',
    icon: 'circle-exclamation',
    title: 'System Notifications',
    subtitle: 'Setup alert pathways',
    iconColor: '#2f66ef',
  },
  {
    id: 'workspace',
    icon: 'sliders',
    title: 'Workspace Preferences',
    subtitle: 'Toggle light/dark layout',
    iconColor: '#2f66ef',
  },
];

const securitySettings = [
  {
    id: 'session',
    icon: 'shield-halved',
    title: 'Session Guard',
    subtitle: 'Two-factor active',
    iconColor: '#2f66ef',
  },
  {
    id: 'integrations',
    icon: 'code',
    title: 'Integrations & API',
    subtitle: 'Manage data hooks',
    iconColor: '#2f66ef',
  },
];

function AdminSettingScreen() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
      <Text style={styles.title}>Control Center</Text>
      <Text style={styles.subtitle}>Configure global workspace variables</Text>

      <Text style={styles.sectionLabel}>GLOBAL SETTINGS</Text>
      <View style={styles.card}>
        {globalSettings.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            style={[styles.row, index !== globalSettings.length - 1 && styles.rowDivider]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconShell}>
                {/* // <FontAwesome6 name={item.icon} style={[styles.rowIcon, {color: item.iconColor}]} /> */}
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            {/* // <FontAwesome6 name="chevron-right" style={styles.chevron} /> */}
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionLabel, styles.securityLabel]}>SECURITY</Text>
      <View style={styles.card}>
        {securitySettings.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            style={[styles.row, index !== securitySettings.length - 1 && styles.rowDivider]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconShell}>
                {/* // <FontAwesome6 name={item.icon} style={[styles.rowIcon, {color: item.iconColor}]} /> */}
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            {/* // <FontAwesome6 name="chevron-right" style={styles.chevron} /> */}
          </Pressable>
        ))}
      </View>

      <View style={[styles.card, styles.dangerCard]}>
        <Pressable accessibilityRole="button" style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconShell, styles.dangerIconShell]}>
              {/* // <FontAwesome6 name="power-off" style={styles.dangerIcon} /> */}
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.rowTitle, styles.dangerTitle]}>Terminate Admin Session</Text>
              <Text style={styles.dangerSubtitle}>Log out of active work profile</Text>
            </View>
          </View>
          {/* // <FontAwesome6 name="chevron-right" style={styles.chevron} /> */}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#f7f9ff',
  },
  title: {
    color: '#142038',
    fontSize: fs(23),
    lineHeight: fs(28),
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subtitle: {
    marginTop: 3,
    color: '#6b7b94',
    fontSize: fs(12),
    lineHeight: fs(16),
    marginBottom: 14,
  },
  sectionLabel: {
    color: '#52627d',
    fontSize: fs(12),
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  securityLabel: {
    marginTop: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e1ef',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e6edf6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  iconShell: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#f5f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIcon: {
    fontSize: fs(15),
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: '#142038',
    fontSize: fs(14),
    lineHeight: fs(18),
    fontWeight: '800',
  },
  rowSubtitle: {
    color: '#94a0b8',
    fontSize: fs(11),
    lineHeight: fs(14),
    marginTop: 2,
  },
  chevron: {
    color: '#8fa0bc',
    fontSize: fs(15),
    marginLeft: 12,
  },
  dangerCard: {
    borderColor: '#f1d3d3',
    backgroundColor: '#fffefe',
  },
  dangerIconShell: {
    backgroundColor: '#fff1f1',
  },
  dangerIcon: {
    color: '#ef4444',
    fontSize: fs(15),
  },
  dangerTitle: {
    color: '#ef4444',
  },
  dangerSubtitle: {
    color: '#f08080',
    fontSize: fs(11),
    lineHeight: fs(14),
    marginTop: 2,
  },
});

export default AdminSettingScreen;
