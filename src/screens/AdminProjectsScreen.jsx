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
import AdminProjectDetailsScreen from './AdminProjectDetailsScreen';

const {width: screenWidth} = Dimensions.get('window');
const scaleFactor = Math.min(screenWidth / 390, 1);
const fs = size => Math.round(size * scaleFactor);

const projects = [
  {
    id: 'skyline',
    title: 'Skyline Commercial Tower',
    client: 'Harrison Group',
    address: '742 Pine St, San Francisco, CA',
    status: 'Active',
    statusColor: '#1bb35c',
    statusTone: '#eaf8ef',
    progress: 0.82,
    progressColor: '#2f66ef',
    dateRange: 'Aug 12 - Dec 24',
    avatar: 'JD',
    avatarTone: '#eef3ff',
    avatarColor: '#2f66ef',
    workers: '+5 workers',
  },
  {
    id: 'apex',
    title: 'Apex Residential Complex',
    client: 'Vanguard Living',
    address: '1108 Broadway Ave, Oakland, CA',
    status: 'Pending',
    statusColor: '#e58a00',
    statusTone: '#fff4dc',
    progress: 0.22,
    progressColor: '#e58a00',
    dateRange: 'Oct 01 - Apr 30',
    avatar: 'AV',
    avatarTone: '#f2ebff',
    avatarColor: '#805ad5',
    workers: 'Unassigned',
  },
];

const filters = [
  {id: 'all', label: 'All (8)', active: true},
  {id: 'active', label: 'Active'},
  {id: 'completed', label: 'Completed'},
];

function AdminProjectsScreen() {
  const [selectedProject, setSelectedProject] = useState(null);

  if (selectedProject) {
    return <AdminProjectDetailsScreen project={selectedProject} />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
      <Text style={styles.title}>Projects Suite</Text>
      <Text style={styles.subtitle}>Manage construction campaigns</Text>

      <View style={styles.searchShell}>
        {/* // <FontAwesome6 name="circle" style={styles.searchIcon} /> */}
        <TextInput
          placeholder="Search projects, clients..."
          placeholderTextColor="#9aa8bf"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filtersRow}>
        {filters.map(filter => (
          <Pressable
            key={filter.id}
            accessibilityRole="button"
            style={[styles.filterChip, filter.active && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter.active && styles.filterChipTextActive]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {projects.map(project => (
        <Pressable
          key={project.id}
          accessibilityRole="button"
          style={styles.card}
          onPress={() => setSelectedProject(project)}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardTopText}>
              <Text style={styles.projectTitle}>{project.title}</Text>
              <Text style={styles.projectClient}>Client: {project.client}</Text>
            </View>
            <View style={[styles.statusPill, {backgroundColor: project.statusTone}]}>
              <Text style={[styles.statusPillText, {color: project.statusColor}]}>{project.status}</Text>
            </View>
          </View>

          <Text style={styles.address}>{project.address}</Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {width: `${Math.round(project.progress * 100)}%`, backgroundColor: project.progressColor},
              ]}
            />
          </View>

          <View style={styles.cardBottomRow}>
            <Text style={styles.dateRange}>{project.dateRange}</Text>
            <View style={styles.workerRow}>
              <View style={[styles.avatarBubble, {backgroundColor: project.avatarTone}]}>
                <Text style={[styles.avatarBubbleText, {color: project.avatarColor}]}>{project.avatar}</Text>
              </View>
              <Text style={styles.workerText}>{project.workers}</Text>
            </View>
          </View>
        </Pressable>
      ))}
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
  searchShell: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8e1ef',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchIcon: {
    color: '#9aa8bf',
    fontSize: fs(13),
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#142038',
    fontSize: fs(13),
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d7e1f0',
    backgroundColor: '#ffffff',
  },
  filterChipActive: {
    backgroundColor: '#2f66ef',
    borderColor: '#2f66ef',
  },
  filterChipText: {
    color: '#627089',
    fontSize: fs(11),
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e1ef',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTopText: {
    flex: 1,
    paddingRight: 12,
  },
  projectTitle: {
    color: '#142038',
    fontSize: fs(15),
    lineHeight: fs(19),
    fontWeight: '800',
  },
  projectClient: {
    color: '#647187',
    fontSize: fs(12),
    lineHeight: fs(15),
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: fs(11),
    fontWeight: '800',
  },
  address: {
    color: '#647187',
    fontSize: fs(12),
    lineHeight: fs(15),
    marginTop: 12,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#e6edf7',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  cardBottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRange: {
    color: '#8fa0bc',
    fontSize: fs(11),
    fontWeight: '600',
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarBubbleText: {
    fontSize: fs(10),
    fontWeight: '800',
  },
  workerText: {
    color: '#627089',
    fontSize: fs(11),
    fontWeight: '700',
  },
});

export default AdminProjectsScreen;
