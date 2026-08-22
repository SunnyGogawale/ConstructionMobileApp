import React, {useState} from 'react';
import {
    Dimensions,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
// import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import AdminProjectsScreen from './AdminProjectsScreen';
import AdminReportsScreen from './AdminReportsScreen';
import AdminSettingScreen from './AdminSettingScreen';
import AdminUsersScreen from './AdminUsersScreen';
import AddNewUserScreen from './AddNewUserScreen';
import AddNewProjectScreen from './AddNewProjectScreen';

const { width: screenWidth } = Dimensions.get('window');
const scaleFactor = Math.min(screenWidth / 390, 1);
const fs = size => Math.round(size * scaleFactor);

const quickOperations = [
    { id: 'add-user', icon: 'user-plus', label: 'Add User' },
    { id: 'new-project', icon: 'folder-plus', label: 'New Proj...' },
    { id: 'safety', icon: 'shield-halved', label: 'Safety L...' },
    { id: 'reports', icon: 'chart-line', label: 'Reports' },
];

const metrics = [
    {
        id: 'active-projects',
        icon: 'briefcase',
        title: 'Active Projects',
        value: '14',
        subValue: '2 Completed',
    },
    {
        id: 'workers',
        icon: 'users',
        title: 'Total Workers',
        value: '142',
        subValue: '88 On-Site Today',
    },
    {
        id: 'revenue',
        icon: 'wallet',
        title: 'Project Revenue',
        value: '$2.4M',
        subValue: '+$142K This Mo.',
    },
];

const recentActions = [
    {
        id: 'new-user',
        color: '#28a35d',
        title: 'New User Created: Alice Vance (PM)',
        subtitle: 'Admin John Doe • 10m ago',
    },
    {
        id: 'report',
        color: '#e58900',
        title: 'Report Generated: July Safety Audit',
        subtitle: 'System Bot • 1h ago',
    },
];

const bottomTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'table-cells' },
    { id: 'projects', label: 'Projects', icon: 'building' },
    { id: 'users', label: 'Users', icon: 'user' },
    { id: 'reports', label: 'Reports', icon: 'chart-simple' },
    { id: 'settings', label: 'Settings', icon: 'gear' },
];

const adminTabViews = {
    projects: {
        title: 'Projects',
        subtitle: 'Track construction project health and milestones.',
        items: ['Metro Tower Phase II', 'Riverfront Mall Renovation', 'Airport Utility Block'],
    },
    users: {
        title: 'Users',
        subtitle: 'Manage team members and role assignments.',
        items: ['12 Admin / Managers', '96 Active Workers', '8 Pending Invites'],
    },
    reports: {
        title: 'Reports',
        subtitle: 'Review generated reports and export summaries.',
        items: ['Safety Audit - July', 'Labor Utilization Weekly', 'Revenue Forecast Q3'],
    },
    settings: {
        title: 'Settings',
        subtitle: 'Configure workspace preferences and system policies.',
        items: ['Notification Preferences', 'Permission Controls', 'Billing & Subscription'],
    },
};

function AdminDashboardScreen({ user }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [subScreen, setSubScreen] = useState(null);

    if (subScreen === 'addUser') {
        return <AddNewUserScreen onBack={() => setSubScreen(null)} />;
    }

    if (subScreen === 'newProject') {
        return <AddNewProjectScreen onBack={() => setSubScreen(null)} />;
    }

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar barStyle="dark-content" backgroundColor="#f7f9ff" />

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>JD</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{user?.name || 'John Doe'}</Text>
                            <Text style={styles.userRole}>Admin Console</Text>
                        </View>
                    </View>

                    <Pressable accessibilityRole="button" style={styles.notificationButton}>
                         {/* <FontAwesome6 name="bell" style={styles.notificationIcon} /> */}
                    </Pressable>
                </View>

                {activeTab === 'dashboard' ? (
                    <>
                        <Text style={styles.sectionHeading}>Quick Operations</Text>
                        <View style={styles.quickGrid}>
                            {quickOperations.map(operation => (
                                <Pressable
                                    key={operation.id}
                                    accessibilityRole="button"
                                    onPress={() => {
                                        if (operation.id === 'add-user') setSubScreen('addUser');
                                        if (operation.id === 'new-project') setSubScreen('newProject');
                                        if (operation.id === 'reports') setActiveTab('reports');
                                    }}
                                    style={styles.quickCard}>
                                    <View style={styles.quickIconCircle}>
                                         {/* <FontAwesome6 name={operation.icon} style={styles.quickIconText} /> */}
                                    </View>
                                    <Text style={styles.quickLabel}>{operation.label}</Text>
                                </Pressable>
                            ))}
                        </View>

                        {metrics.map(metric => (
                            <Pressable key={metric.id} accessibilityRole="button" style={styles.metricCard}>
                                <View style={styles.metricLeft}>
                                    <View style={styles.metricIconCircle}>
                                        {/* <FontAwesome6 name={metric.icon} style={styles.metricIcon} /> */}
                                    </View>
                                    <View style={styles.metricTextBlock}>
                                        <Text style={styles.metricTitle}>{metric.title}</Text>
                                        <Text style={styles.metricValue}>{metric.value}</Text>
                                        <Text style={styles.metricSubValue}>{metric.subValue}</Text>
                                    </View>
                                </View>

                                {/* <FontAwesome6 name="chevron-right" style={styles.chevron} /> */}
                            </Pressable>
                        ))}

                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionHeadingInline}>Recent Workspace Actions</Text>
                            <Pressable accessibilityRole="button">
                                <Text style={styles.viewAll}>View All</Text>
                            </Pressable>
                        </View>

                        {recentActions.map(action => (
                            <View key={action.id} style={styles.activityRow}>
                                <View style={[styles.activityDot, { backgroundColor: action.color }]} />
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle}>{action.title}</Text>
                                    <Text style={styles.activitySubtitle}>{action.subtitle}</Text>
                                </View>
                            </View>
                        ))}
                    </>
                ) : activeTab === 'projects' ? (
                    <AdminProjectsScreen />
                ) : activeTab === 'users' ? (
                    <AdminUsersScreen />
                ) : activeTab === 'reports' ? (
                    <AdminReportsScreen />
                ) : activeTab === 'settings' ? (
                    <AdminSettingScreen />
                ) : (
                    <View style={styles.tabViewWrapper}>
                        <Text style={styles.sectionHeading}>{adminTabViews[activeTab].title}</Text>
                        <Text style={styles.tabSubtitle}>{adminTabViews[activeTab].subtitle}</Text>

                        {adminTabViews[activeTab].items.map(item => (
                            <View key={item} style={styles.tabInfoCard}>
                                <View style={styles.tabInfoIconCircle}>
                                    {/* <FontAwesome6 name="circle-check" style={styles.tabInfoIcon} /> */}
                                </View>
                                <Text style={styles.tabInfoText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

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
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#2d6cdf',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#2d6cdf',
        fontWeight: '700',
        fontSize: fs(14),
    },
    userName: {
        color: '#142038',
        fontSize: fs(16),
        lineHeight: fs(19),
        fontWeight: '700',
    },
    userRole: {
        marginTop: 2,
        color: '#e28400',
        fontSize: fs(12),
        lineHeight: fs(15),
        fontWeight: '800',
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#d9e2f1',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationIcon: {
        color: '#142038',
        fontSize: fs(17),
        fontWeight: '700',
    },
    sectionHeading: {
        marginTop: 20,
        marginBottom: 12,
        color: '#18243a',
        fontSize: fs(15),
        lineHeight: fs(18),
        fontWeight: '400',
    },
    quickGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    quickCard: {
        width: '23.5%',
        minHeight: 72,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d7e1f0',
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        paddingBottom: 6,
    },
    quickIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: '#ecf2ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    quickIconText: {
        color: '#2d6cdf',
        fontWeight: '700',
        fontSize: fs(13),
    },
    quickLabel: {
        color: '#1d2940',
        fontSize: fs(10),
        lineHeight: fs(12),
        fontWeight: '600',
        textAlign: 'center',
    },
    metricCard: {
        marginTop: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#d7e1f0',
        backgroundColor: '#ffffff',
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metricLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        // padding: 16,
    },
    metricTextBlock: {
        flexShrink: 1,
    },
    metricIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: '#ecf2ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    metricIcon: {
        color: '#2d6cdf',
        fontSize: fs(14),
        fontWeight: '700',
    },
    metricTitle: {
        color: '#42526d',
        fontSize: fs(12),
        lineHeight: fs(14),
        fontWeight: '600',
    },
    metricValue: {
        marginTop: 1,
        color: '#152238',
        fontSize: fs(17),
        lineHeight: fs(20),
        fontWeight: '800',
    },
    metricSubValue: {
        marginTop: 1,
        color: '#8394b1',
        fontSize: fs(11),
        lineHeight: fs(13),
        fontWeight: '500',
    },
    chevron: {
        color: '#8ea0be',
        fontSize: fs(20),
        lineHeight: fs(20),
        fontWeight: '500',
        paddingRight: 10,
    },
    sectionHeaderRow: {
        marginTop: 18,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionHeadingInline: {
        color: '#18243a',
        fontSize: fs(15),
        lineHeight: fs(18),
        fontWeight: '700',
        marginTop: 0,
        marginBottom: 0,
    },
    viewAll: {
        color: '#2d6cdf',
        fontWeight: '700',
        fontSize: fs(13),
    },
    activityRow: {
        marginBottom: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#d7e1f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    activityDot: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        marginTop: 8,
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        color: '#1c2840',
        fontSize: fs(14),
        lineHeight: fs(20),
        fontWeight: '600',
    },
    activitySubtitle: {
        marginTop: 2,
        color: '#5e6f8b',
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
        fontSize: fs(16),
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
    tabViewWrapper: {
        marginTop: 14,
    },
    tabSubtitle: {
        color: '#5e6f8b',
        fontSize: fs(12),
        lineHeight: fs(16),
        marginBottom: 10,
    },
    tabInfoCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d7e1f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabInfoIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#ecf2ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    tabInfoIcon: {
        color: '#2d6cdf',
        fontSize: fs(11),
    },
    tabInfoText: {
        color: '#1c2840',
        fontSize: fs(12),
        lineHeight: fs(16),
        fontWeight: '600',
        flex: 1,
    },
});

export default AdminDashboardScreen;
