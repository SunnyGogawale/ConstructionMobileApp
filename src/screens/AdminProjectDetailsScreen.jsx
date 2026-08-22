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

function AdminProjectDetailsScreen({project}) {
  const projectData = project || {
    title: 'Skyline Commercial Tower',
    campaign: 'CAMPAIGN #BF-908',
    status: 'Active',
    client: 'Harrison Group Inc.',
    contactEmail: 'harrison@group.com',
    contact: '(415) 555-0199',
    address: '742 Pine St, San Francisco, CA',
    managerInitials: 'AV',
    managerName: 'Alice Vance',
    managerRole: 'Primary Project Manager',
    milestonePercent: 68,
    activeMilestone: 'Framing Steel Assembly',
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{projectData.title}</Text>
          <Text style={styles.subtitle}>{projectData.campaign}</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{projectData.status}</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        <Pressable accessibilityRole="button" style={[styles.tabChip, styles.tabChipActive]}>
          <Text style={[styles.tabChipText, styles.tabChipTextActive]}>Timeline</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.tabChip}>
          <Text style={styles.tabChipText}>Photos</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.tabChip}>
          <Text style={styles.tabChipText}>Notes (4)</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>Client Information</Text>
        <View style={styles.clientRow}>
          <View style={styles.clientBlock}>
            <Text style={styles.clientName}>{projectData.client}</Text>
            <Text style={styles.clientEmail}>{projectData.contactEmail}</Text>
          </View>
          <Text style={styles.clientPhone}>{projectData.contact}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>Site Location</Text>
        <View style={styles.mapMock}>
          <View style={styles.mapGreen} />
          <View style={styles.mapMarker}>
            {/* // <FontAwesome6 name="location-dot" style={styles.mapMarkerIcon} /> */}
          </View>
        </View>
        <Text style={styles.address}>{projectData.address}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.managerRow}>
          <View style={styles.managerAvatar}>
            <Text style={styles.managerAvatarText}>{projectData.managerInitials}</Text>
          </View>
          <View style={styles.managerTextBlock}>
            <Text style={styles.managerName}>{projectData.managerName}</Text>
            <Text style={styles.managerRole}>{projectData.managerRole}</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.callButton}>
            {/* // <FontAwesome6 name="phone" style={styles.callIcon} /> */}  
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeadingRow}>
          <Text style={styles.cardHeading}>Project Milestones</Text>
          <Text style={styles.milestonePercent}>{projectData.milestonePercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${projectData.milestonePercent}%`}]} />
        </View>
        <View style={styles.milestoneList}>
          <Text style={styles.milestoneMuted}>Site Clearance & Excavation</Text>
          <Text style={styles.milestoneMuted}>Foundation Concrete Pour</Text>
          <View style={styles.activeMilestoneRow}>
            {/* // <FontAwesome6 name="clock" style={styles.activeMilestoneIcon} /> */}
            <Text style={styles.activeMilestone}>{projectData.activeMilestone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable accessibilityRole="button" style={[styles.actionButton, styles.primaryButton]}>
          <Text style={[styles.actionText, styles.primaryButtonText]}>View Attendance</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={[styles.actionButton, styles.secondaryButton]}>
          <Text style={styles.actionText}>Mark Complete</Text>
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" style={styles.editButton}>
        <Text style={styles.editButtonText}>Edit specifications</Text>
      </Pressable>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: '#142038',
    fontSize: fs(21),
    lineHeight: fs(26),
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7b94',
    fontSize: fs(11),
    lineHeight: fs(14),
    letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#eaf8ef',
    marginTop: 3,
  },
  statusPillText: {
    color: '#17a34a',
    fontSize: fs(11),
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8e1ef',
    backgroundColor: '#ffffff',
  },
  tabChipActive: {
    backgroundColor: '#eef4ff',
    borderColor: '#d6e0f7',
  },
  tabChipText: {
    color: '#627089',
    fontSize: fs(11),
    fontWeight: '700',
  },
  tabChipTextActive: {
    color: '#2f66ef',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e1ef',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  cardHeading: {
    color: '#142038',
    fontSize: fs(14),
    lineHeight: fs(18),
    fontWeight: '800',
    marginBottom: 10,
  },
  cardHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientBlock: {
    flex: 1,
    paddingRight: 10,
  },
  clientName: {
    color: '#142038',
    fontSize: fs(15),
    lineHeight: fs(19),
    fontWeight: '800',
  },
  clientEmail: {
    color: '#8fa0bc',
    fontSize: fs(11),
    lineHeight: fs(14),
    marginTop: 2,
  },
  clientPhone: {
    color: '#2f66ef',
    fontSize: fs(12),
    fontWeight: '800',
  },
  mapMock: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#dfe7d6',
    position: 'relative',
    marginBottom: 10,
  },
  mapGreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#dcecc8',
  },
  mapMarker: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{translateX: -9}, {translateY: -18}],
  },
  mapMarkerIcon: {
    color: '#ef4444',
    fontSize: fs(18),
  },
  address: {
    color: '#627089',
    fontSize: fs(12),
    lineHeight: fs(15),
  },
  managerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  managerAvatarText: {
    color: '#8b78ff',
    fontSize: fs(13),
    fontWeight: '800',
  },
  managerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  managerName: {
    color: '#142038',
    fontSize: fs(14),
    lineHeight: fs(18),
    fontWeight: '800',
  },
  managerRole: {
    color: '#6b7b94',
    fontSize: fs(11),
    lineHeight: fs(14),
    marginTop: 2,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef4ff',
  },
  callIcon: {
    color: '#2f66ef',
    fontSize: fs(13),
  },
  milestonePercent: {
    color: '#17a34a',
    fontSize: fs(13),
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#e6edf7',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2f66ef',
  },
  milestoneList: {
    marginTop: 12,
    gap: 6,
  },
  milestoneMuted: {
    color: '#647187',
    fontSize: fs(12),
    lineHeight: fs(15),
  },
  activeMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  activeMilestoneIcon: {
    color: '#ef7d00',
    fontSize: fs(12),
  },
  activeMilestone: {
    color: '#142038',
    fontSize: fs(12),
    lineHeight: fs(15),
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#2f66ef',
    borderColor: '#2f66ef',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#d8e1ef',
  },
  actionText: {
    color: '#142038',
    fontSize: fs(13),
    fontWeight: '800',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  editButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d8e1ef',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#142038',
    fontSize: fs(13),
    fontWeight: '800',
  },
});

export default AdminProjectDetailsScreen;
