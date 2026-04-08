import { DnDColors } from '@/constants/colors';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type ViewStyle } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
};

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  style,
  multiline = false,
  numberOfLines = 1,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={DnDColors.textDisabled}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused && styles.focused,
          multiline && { height: numberOfLines * 24 + 20, textAlignVertical: 'top' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    color: DnDColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: DnDColors.surface,
    borderWidth: 1,
    borderColor: DnDColors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: DnDColors.text,
    fontSize: 15,
  },
  focused: {
    borderColor: DnDColors.accent,
  },
});
