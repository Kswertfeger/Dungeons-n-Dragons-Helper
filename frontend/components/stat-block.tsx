import { DnDColors } from '@/constants/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  stat: string;
  value: number;
};

export function StatBlock({ stat, value }: Props) {
  const modifier = Math.floor((value - 10) / 2);
  const modLabel = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <View style={styles.block}>
      <Text style={styles.statName}>{stat}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.modifier}>{modLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: DnDColors.border,
  },
  statName: {
    color: DnDColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    color: DnDColors.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  modifier: {
    color: DnDColors.accentLight,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
});
