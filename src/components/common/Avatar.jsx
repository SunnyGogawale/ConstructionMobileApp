import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {COLORS, RADIUS} from '../../styles/theme';
import {fs} from '../../utils/scale';

function getInitials(name) {
  if (!name) return '??';
  return name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

function Avatar({name, initials, size = 44, bg, color, borderColor, style}) {
  const letters = initials ?? getInitials(name);
  const resolvedBg = bg ?? COLORS.primaryLight;
  const resolvedColor = color ?? COLORS.primary;
  const fontSize = fs(Math.round(size * 0.32));

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: resolvedBg,
          borderColor: borderColor ?? resolvedColor,
        },
        style,
      ]}>
      <Text style={[styles.text, {color: resolvedColor, fontSize}]}>
        {letters}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  text: {
    fontWeight: '800',
  },
});

export default Avatar;
