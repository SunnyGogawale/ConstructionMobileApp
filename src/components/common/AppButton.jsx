import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import {COLORS, FONT_SIZE, RADIUS, SPACING} from '../../styles/theme';

function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  labelStyle,
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled}}
      onPress={isDisabled ? undefined : onPress}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : COLORS.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], labelStyle]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
  },
  // Variants
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.bgMuted,
  },
  outline: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  size_sm: {height: 36, paddingHorizontal: SPACING.md},
  size_md: {height: 48, paddingHorizontal: SPACING.lg},
  size_lg: {height: 54, paddingHorizontal: SPACING.xl},
  // Labels
  label: {fontSize: FONT_SIZE.base, fontWeight: '700'},
  label_primary: {color: '#ffffff'},
  label_secondary: {color: COLORS.textPrimary},
  label_outline: {color: COLORS.textPrimary},
  label_danger: {color: '#ffffff'},
  label_ghost: {color: COLORS.primary},
  // State
  disabled: {opacity: 0.5},
});

export default AppButton;
