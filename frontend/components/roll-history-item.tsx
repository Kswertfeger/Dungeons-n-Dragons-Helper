import { DnDColors, RollTypeBadgeColors } from '@/constants/colors';
import { type RollHistory } from '@/services/api';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  roll: RollHistory;
};

export function RollHistoryItem({ roll }: Props) {
  const badgeColor = RollTypeBadgeColors[roll.roll_type] ?? RollTypeBadgeColors.CUSTOM;
  const modLabel = roll.modifier >= 0 ? `+${roll.modifier}` : `${roll.modifier}`;
  const date = new Date(roll.created_at);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={styles.badgeText}>{roll.roll_type}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.statsRow}>
          <StatItem label="Base" value={String(roll.base_roll)} />
          <StatItem label="Modifier" value={modLabel} />
          <StatItem label="Total" value={String(roll.total)} highlight />
        </View>
        <Text style={styles.meta}>
          {roll.num_dice}{roll.dice_type}  ·  {dateStr} {timeStr}
        </Text>
      </View>
    </View>
  );
}

function StatItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.highlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: DnDColors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: DnDColors.border,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 48,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  details: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: DnDColors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    color: DnDColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  highlight: {
    color: DnDColors.accentLight,
  },
  meta: {
    color: DnDColors.textDisabled,
    fontSize: 11,
  },
});
