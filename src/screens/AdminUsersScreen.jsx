import React, {useState} from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
// import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

const {width: screenWidth} = Dimensions.get('window');
const scaleFactor = Math.min(screenWidth / 390, 1);
const fs = size => Math.round(size * scaleFactor);

const ALL_USERS = [
  {
    id: 'alice',
    name: 'Alice Vance',
    email: 'alice@buildflow.com',
    role: 'Project Manager',
    status: 'Active',
    initials: 'AV',
    avatarBg: '#e6f4ec',
    avatarColor: '#28a35d',
  },
  {
    id: 'bob',
    name: 'Bob Constructor',
    email: 'bob@buildflow.com',
    role: 'Worker',
    status: 'Active',
    initials: 'BC',
    avatarBg: '#fff4e5',
    avatarColor: '#e07b00',
  },
  {
    id: 'charlie',
    name: 'Charlie Dev',
    email: 'charlie@buildflow.com',
    role: 'Admin',
    status: 'Inactive',
    initials: 'CD',
    avatarBg: '#eef1f7',
    avatarColor: '#6b7fa3',
  },
];

const ROLE_FILTERS = [
  {id: 'all', label: 'All Roles'},
  {id: 'Project Manager', label: 'Project Managers'},
  {id: 'Worker', label: 'Workers'},
  {id: 'Admin', label: 'Admins'},
];

function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState('all');

  const filtered = ALL_USERS.filter(u => {
    const matchesRole = activeRole === 'all' || u.role === activeRole;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Staff Directory</Text>
          <Text style={styles.subtitle}>
            {ALL_USERS.length} Total Workspace Accounts
          </Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.exportBtn}>
          {/* // <FontAwesome6 name="download" style={styles.exportIcon} /> */}
          <Text style={styles.exportLabel}>Export</Text>
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchShell}>
        {/* // <FontAwesome6 name="magnifying-glass" style={styles.searchIcon} /> */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, role..."
          placeholderTextColor="#9aa3b3"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <Pressable accessibilityRole="button" style={styles.filterBtn}>
          {/* // <FontAwesome6 name="sliders" style={styles.filterIcon} /> */}
        </Pressable>
      </View>

      {/* Role filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsRow}
        contentContainerStyle={styles.tabsContent}>
        {ROLE_FILTERS.map(f => {
          const isActive = activeRole === f.id;
          const count =
            f.id === 'all'
              ? ALL_USERS.length
              : ALL_USERS.filter(u => u.role === f.id).length;
          return (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityState={{selected: isActive}}
              onPress={() => setActiveRole(f.id)}
              style={[styles.filterTab, isActive && styles.filterTabActive]}>
              <Text
                numberOfLines={1}
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}>
                {f.label}
                {f.id === 'all' ? ` (${count})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* User list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}>
        {filtered.map(user => (
          <Pressable
            key={user.id}
            accessibilityRole="button"
            style={styles.userCard}>
            {/* Avatar */}
            <View
              style={[
                styles.avatarCircle,
                {backgroundColor: user.avatarBg},
              ]}>
              <Text style={[styles.avatarText, {color: user.avatarColor}]}>
                {user.initials}
              </Text>
            </View>

            {/* Info */}
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        user.status === 'Active' ? '#28a35d' : '#9aa3b3',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusLabel,
                    {
                      color:
                        user.status === 'Active' ? '#28a35d' : '#9aa3b3',
                    },
                  ]}>
                  {user.status}
                </Text>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{user.role}</Text>
              </View>
            </View>

            {/* // <FontAwesome6 name="chevron-right" style={styles.chevron} /> */}
          </Pressable>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            {/* // <FontAwesome6 name="users-slash" style={styles.emptyIcon} /> */}
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 14,
  },
  title: {
    color: '#142038',
    fontSize: fs(20),
    fontWeight: '800',
    lineHeight: fs(24),
  },
  subtitle: {
    marginTop: 2,
    color: '#6b7fa3',
    fontSize: fs(12),
    lineHeight: fs(16),
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0daf0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  exportIcon: {
    color: '#2d6cdf',
    fontSize: fs(13),
  },
  exportLabel: {
    color: '#2d6cdf',
    fontSize: fs(13),
    fontWeight: '600',
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchIcon: {
    color: '#9aa3b3',
    fontSize: fs(14),
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#142038',
    fontSize: fs(14),
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 4,
  },
  filterIcon: {
    color: '#4a5e7a',
    fontSize: fs(16),
  },
  tabsRow: {
    flexGrow: 0,
    marginBottom: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabsContent: {
    gap: 5,
    paddingRight: 4,
    alignItems: 'center',
  },
  filterTab: {
    height: 30,
    flexShrink: 0,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d0daf0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#2d6cdf',
    borderColor: '#2d6cdf',
  },
  filterTabText: {
    color: '#4a5e7a',
    fontSize: fs(13),
    fontWeight: '500',
    flexShrink: 0,
    lineHeight: fs(16),
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    gap: 10,
    paddingBottom: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: fs(15),
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  userName: {
    color: '#142038',
    fontSize: fs(15),
    fontWeight: '700',
    lineHeight: fs(20),
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: fs(12),
    fontWeight: '500',
  },
  userEmail: {
    color: '#5e6f8b',
    fontSize: fs(12),
    lineHeight: fs(17),
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c8d5ec',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    color: '#3d5275',
    fontSize: fs(11),
    fontWeight: '500',
  },
  chevron: {
    color: '#8ea0be',
    fontSize: fs(14),
    paddingLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: {
    color: '#b0bcd4',
    fontSize: fs(36),
  },
  emptyText: {
    color: '#8394b1',
    fontSize: fs(14),
  },
});

export default AdminUsersScreen;
