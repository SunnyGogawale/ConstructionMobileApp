import React, {useState} from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
// import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const {width: screenWidth} = Dimensions.get('window');
const scaleFactor = Math.min(screenWidth / 390, 1);
const fs = size => Math.round(size * scaleFactor);

const quickActions = [
  {id: 'check-in', icon: 'camera', label: 'Check In'},
  {id: 'update-work', icon: 'arrow-trend-up', label: 'Update Work'},
  {id: 'docs', icon: 'file-lines', label: 'Docs / Specs'},
];

const bottomTabs = [
  {id: 'home', label: 'Home', icon: 'house'},
  {id: 'projects', label: 'Projects', icon: 'table-cells'},
  {id: 'attendance', label: 'Attendance', icon: 'calendar-check'},
  {id: 'alerts', label: 'Alerts', icon: 'bell'},
  {id: 'profile', label: 'Profile', icon: 'circle-user'},
];

function WorkerDashboardScreen({user}) {
  const [activeTab, setActiveTab] = useState('home');

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : 'MB';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{user?.name || 'Marcus Brody'}</Text>
              <Text style={styles.userRole}>On-Site Crew</Text>
            </View>
          </View>
          <View style={styles.shiftBadge}>
            <Text style={styles.shiftBadgeText}>Shift Active</Text>
          </View>
        </View>

        {/* Active Assignment card */}
        <View style={styles.assignmentCard}>
          <View style={styles.assignmentTopRow}>
            <View style={styles.assignmentLabelRow}>
              <View style={styles.assignmentDot} />
              <Text style={styles.assignmentLabel}>ACTIVE ASSIGNMENT</Text>
            </View>
            <Text style={styles.checkedInLabel}>Today: Checked In</Text>
          </View>

          <Text style={styles.assignmentTitle}>Skyline Tower (Phase 2)</Text>
          <Text style={styles.assignmentAddress}>742 Pine St, San Francisco, CA</Text>

          <View style={styles.assignmentActions}>
            <Pressable accessibilityRole="button" style={styles.breakBtn}>
              {/* // <FontAwesome6 name="clock" style={styles.breakBtnIcon} /> */}
              <Text style={styles.breakBtnText}>Take Break</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.checkOutBtn}>
              {/* // <FontAwesome6 name="arrow-right-from-bracket" style={styles.checkOutIcon} /> */}
              <Text style={styles.checkOutText}>Check Out</Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {quickActions.map(action => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              style={styles.quickCard}>
              <View style={styles.quickIconBg}>
                {/* // <FontAwesome6 name={action.icon} style={styles.quickIcon} /> */}
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Weekly Summary */}
        <Text style={styles.sectionTitle}>Weekly Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Hours Logged</Text>
            <Text style={styles.summaryValue}>38.5h</Text>
            <Text style={[styles.summarySub, {color: '#1bb35c'}]}>Goal: 40h</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Attendance Rate</Text>
            <Text style={styles.summaryValue}>98%</Text>
            <Text style={[styles.summarySub, {color: '#2d6cdf'}]}>Top Tier</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.bottomTabBar}>
        {bottomTabs.map(tab => (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityState={{selected: activeTab === tab.id}}
            onPress={() => setActiveTab(tab.id)}
            style={styles.tabItem}>
            {/* {/* // <FontAwesome6 */}
              {/* name={tab.icon}
              style={[styles.tabIcon, activeTab === tab.id && styles.tabActive]}
            /> */}
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9ff',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2d6cdf',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  avatarText: {
    color: '#2d6cdf',
    fontSize: fs(15),
    fontWeight: '800',
  },
  userName: {
    color: '#142038',
    fontSize: fs(17),
    fontWeight: '800',
    lineHeight: fs(22),
  },
  userRole: {
    marginTop: 1,
    color: '#1bb35c',
    fontSize: fs(12),
    fontWeight: '600',
  },
  shiftBadge: {
    backgroundColor: '#eaf8ef',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shiftBadgeText: {
    color: '#1bb35c',
    fontSize: fs(12),
    fontWeight: '700',
  },
  assignmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    padding: 12,
    marginBottom: 2,
  },
  assignmentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2d6cdf',
  },
  assignmentLabel: {
    color: '#2d6cdf',
    fontSize: fs(11),
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  checkedInLabel: {
    color: '#6b7fa3',
    fontSize: fs(11),
    fontWeight: '500',
  },
  assignmentTitle: {
    color: '#142038',
    fontSize: fs(18),
    fontWeight: '800',
    lineHeight: fs(24),
    marginBottom: 4,
  },
  assignmentAddress: {
    color: '#6b7fa3',
    fontSize: fs(13),
    lineHeight: fs(18),
    marginBottom: 10,
  },
  assignmentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  breakBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d0daf0',
    backgroundColor: '#ffffff',
  },
  breakBtnIcon: {
    color: '#3d5275',
    fontSize: fs(14),
  },
  breakBtnText: {
    color: '#3d5275',
    fontSize: fs(14),
    fontWeight: '600',
  },
  checkOutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e07b00',
    backgroundColor: '#fff8ee',
  },
  checkOutIcon: {
    color: '#e07b00',
    fontSize: fs(14),
  },
  checkOutText: {
    color: '#e07b00',
    fontSize: fs(14),
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#142038',
    fontSize: fs(16),
    fontWeight: '800',
    lineHeight: fs(22),
    marginTop: 12,
    marginBottom: 8,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  quickIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eef3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: {
    color: '#2d6cdf',
    fontSize: fs(16),
  },
  quickLabel: {
    color: '#142038',
    fontSize: fs(11),
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryTitle: {
    color: '#6b7fa3',
    fontSize: fs(12),
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValue: {
    color: '#142038',
    fontSize: fs(26),
    fontWeight: '800',
    lineHeight: fs(32),
  },
  summarySub: {
    fontSize: fs(12),
    fontWeight: '700',
    marginTop: 4,
  },
  bottomTabBar: {
    borderTopWidth: 1,
    borderColor: '#d7e1f0',
    backgroundColor: '#ffffff',
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    color: '#8ba0bf',
    fontSize: fs(18),
    marginBottom: 3,
  },
  tabLabel: {
    color: '#8ba0bf',
    fontSize: fs(10),
    fontWeight: '500',
  },
  tabActive: {
    color: '#2d6cdf',
    fontWeight: '700',
  },
});

export default WorkerDashboardScreen;
