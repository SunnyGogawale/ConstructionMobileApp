import React from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';
import {COLORS, FONT_SIZE, RADIUS, SPACING} from '../../styles/theme';

function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  secureTextEntry = false,
  multiline = false,
  numberOfLines,
  left,
  right,
  error,
  style,
  inputStyle,
}) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.shell,
          multiline && styles.shellMultiline,
          error && styles.shellError,
        ]}>
        {left ?? null}

        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />

        {right ?? null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: SPACING.md,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 5,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    height: 50,
  },
  shellMultiline: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
  },
  shellError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: 76,
  },
  errorText: {
    marginTop: 4,
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,
  },
});

export default AppInput;
