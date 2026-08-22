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

const metrics = [
  {
    id: 'active-projects',
    title: 'Active Projects',
    value: '8',
    sub: '2 ahead of timeline',
    subColor: '#1bb35c',
  },
  {
    id: 'workers',
    title: 'Workers Assigned',
    value: '42',
    sub: '12 on active shift',
    subColor: '#6b7fa3',
  },
  {
    id: 'approvals',
    title: 'Pending Approvals',
    value: '5',
    sub: 'Action required',
    subColor: '#e07b00',
  },
  {
    id: 'revenue',
    title: 'Revenue This Month',
    value: '$450K',
    sub: '+$48K this week',
    subColor: '#2d6cdf',
  },
];

const recentActivity = [
  {
    id: 'skyline',
    dot: '#1bb35c',
    title: 'Skyline Tower: Foundation poured',
    subtitle: 'Pitched by Site Supervisor • 10m ago',
  },
  {
    id: 'apex',
    dot: '#e07b00',
    title: 'Apex Plaza: 3 Pending photo approvals',
    subtitle: 'Uploaded by Worker Bob • 1h ago',
  },
];

const bottomTabs = [
  {id: 'dashboard', label: 'Dashboard', icon: 'table-cells-large'},
  {id: 'projects', label: 'Projects', icon: 'building'},
  {id: 'billing', label: 'Billing', icon: 'file-invoice-dollar'},
  {id: 'alerts', label: 'Alerts', icon: 'bell'},
  {id: 'profile', label: 'Profile', icon: 'circle-user'},
];

function ProjectManagerDashboardScreen({user}) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : 'SC';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.userName}>{user?.name || 'Sarah Carter'}</Text>
            <Text style={styles.userRole}>Project Manager Console</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Metrics 2x2 grid */}
        <View style={styles.metricsGrid}>
          {metrics.map(m => (
            <View key={m.id} style={styles.metricCard}>
              <Text style={styles.metricTitle}>{m.title}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={[styles.metricSub, {color: m.subColor}]}>{m.sub}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <Pressable accessibilityRole="button" style={styles.createBtn}>
            {/* // <FontAwesome6 name="plus" style={styles.createBtnIcon} /> */}
            <Text style={styles.createBtnText}>Create Project</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.reportsBtn}>
            {/* // <FontAwesome6 name="chart-line" style={styles.reportsBtnIcon} /> */}
            <Text style={styles.reportsBtnText}>View Reports</Text>
          </Pressable>
        </View>

        {/* Recent Project Activity */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Project Activity</Text>
          <Pressable accessibilityRole="button">
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        {recentActivity.map(item => (
          <View key={item.id} style={styles.activityCard}>
            <View style={[styles.activityDot, {backgroundColor: item.dot}]} />
            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
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
            {/* // <FontAwesome6
              name={tab.icon}
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    color: '#142038',
    fontSize: fs(22),
    fontWeight: '800',
    lineHeight: fs(28),
  },
  userRole: {
    marginTop: 2,
    color: '#6b7fa3',
    fontSize: fs(13),
    lineHeight: fs(17),
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 2,
  },
  metricCard: {
    width: '47.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricTitle: {
    color: '#6b7fa3',
    fontSize: fs(12),
    fontWeight: '600',
    lineHeight: fs(16),
    marginBottom: 6,
  },
  metricValue: {
    color: '#142038',
    fontSize: fs(28),
    fontWeight: '800',
    lineHeight: fs(34),
  },
  metricSub: {
    fontSize: fs(12),
    fontWeight: '600',
    lineHeight: fs(16),
    marginTop: 4,
  },
  sectionTitle: {
    color: '#142038',
    fontSize: fs(17),
    fontWeight: '800',
    lineHeight: fs(22),
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  viewAll: {
    color: '#2d6cdf',
    fontSize: fs(13),
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2d6cdf',
  },
  createBtnIcon: {
    color: '#ffffff',
    fontSize: fs(14),
    fontWeight: '700',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: fs(14),
    fontWeight: '700',
  },
  reportsBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d0daf0',
    backgroundColor: '#ffffff',
  },
  reportsBtnText: {
    color: '#142038',
    fontSize: fs(14),
    fontWeight: '700',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  activityDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    color: '#142038',
    fontSize: fs(14),
    fontWeight: '700',
    lineHeight: fs(20),
  },
  activitySubtitle: {
    marginTop: 2,
    color: '#6b7fa3',
    fontSize: fs(12),
    lineHeight: fs(17),
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

export default ProjectManagerDashboardScreen;
