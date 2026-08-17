import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {COLORS} from '../../styles/theme';
import {fs} from '../../utils/scale';

function BottomTabBar({tabs, activeTab, onTabPress}) {
  return (
    <View style={styles.bar}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityState={{selected: isActive}}
            onPress={() => onTabPress(tab.id)}
            style={styles.item}>
            <FontAwesome6
              name={tab.icon}
              style={[styles.icon, isActive && styles.active]}
            />
            <Text style={[styles.label, isActive && styles.active]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 70,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: COLORS.textMuted,
    fontSize: fs(18),
    marginBottom: 3,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: fs(10),
    fontWeight: '500',
  },
  active: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default BottomTabBar;
