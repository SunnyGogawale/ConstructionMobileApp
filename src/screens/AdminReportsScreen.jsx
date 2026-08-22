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
const progressTrackWidth = Math.round(screenWidth - 72);
const progressBlueWidth = Math.round(progressTrackWidth * 0.92);
const progressOrangeWidth = Math.round(progressTrackWidth * 0.78);

function AdminReportsScreen() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
      <Text style={styles.title}>Operational Reports</Text>
      <Text style={styles.subtitle}>Continuous system analysis</Text>

      <Pressable accessibilityRole="button" style={styles.filterBar}>
        <View style={styles.filterLeft}>
          {/* // <FontAwesome6 name="calendar-days" style={styles.filterIcon} /> */}
          <Text style={styles.filterText}>Last 30 Days (July 2024)</Text>
        </View>
        {/* // <FontAwesome6 name="chevron-down" style={styles.chevron} /> */}
      </Pressable>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Completion Rate</Text>
          <Text style={styles.cardMeta}>86% Avg</Text>
        </View>

        <View style={styles.donutWrap}>
          <View style={styles.donutOuter}>
            <View style={styles.donutInner}>
              <Text style={styles.donutValue}>86%</Text>
              <Text style={styles.donutLabel}>Target 90%</Text>
            </View>
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.legendSwatchBlue} />
            <Text style={styles.legendText}>Completed On Time</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendSwatchGray} />
            <Text style={styles.legendText}>Delayed</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>On-Site Worker Productivity</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Skyline Tower Phase A</Text>
          <Text style={styles.metricValue}>92%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFillBlue} />
        </View>

        <View style={[styles.metricRow, styles.secondMetricRow]}>
          <Text style={styles.metricLabel}>Green Valley Complex</Text>
          <Text style={styles.metricValue}>78%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFillOrange} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#f7f9ff',
    flexGrow: 1,
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
  filterBar: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d8e1ef',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterIcon: {
    color: '#2f66ef',
    fontSize: fs(15),
  },
  filterText: {
    color: '#142038',
    fontSize: fs(14),
    fontWeight: '700',
  },
  chevron: {
    color: '#627089',
    fontSize: fs(14),
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e1ef',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#1f2e57',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    color: '#142038',
    fontSize: fs(15),
    lineHeight: fs(18),
    fontWeight: '800',
  },
  cardMeta: {
    color: '#17a34a',
    fontSize: fs(12),
    lineHeight: fs(15),
    fontWeight: '700',
  },
  donutWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 14,
  },
  donutOuter: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 11,
    borderColor: '#dfe6f4',
    borderTopColor: '#2f66ef',
    borderRightColor: '#2f66ef',
    transform: [{rotate: '25deg'}],
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{rotate: '-25deg'}],
  },
  donutValue: {
    color: '#142038',
    fontSize: fs(24),
    lineHeight: fs(26),
    fontWeight: '800',
  },
  donutLabel: {
    color: '#96a3b8',
    fontSize: fs(10),
    lineHeight: fs(12),
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 3,
  },
  legendSwatchBlue: {
    width: 11,
    height: 11,
    borderRadius: 3,
    backgroundColor: '#2f66ef',
  },
  legendSwatchGray: {
    width: 11,
    height: 11,
    borderRadius: 3,
    backgroundColor: '#d9e0ed',
  },
  legendText: {
    color: '#647187',
    fontSize: fs(11),
    lineHeight: fs(14),
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 7,
  },
  secondMetricRow: {
    marginTop: 12,
  },
  metricLabel: {
    color: '#142038',
    fontSize: fs(13),
    fontWeight: '700',
  },
  metricValue: {
    color: '#142038',
    fontSize: fs(13),
    fontWeight: '800',
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#eef3fb',
    overflow: 'hidden',
  },
  progressFillBlue: {
    width: progressBlueWidth,
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2f66ef',
  },
  progressFillOrange: {
    width: progressOrangeWidth,
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#e58a00',
  },
});

export default AdminReportsScreen;
