import { DnDColors } from '@/constants/colors';
import { type Spell } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  spell: Spell;
  onDelete: () => void;
};

export function SpellCard({ spell, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{spell.level === 0 ? 'C' : spell.level}</Text>
          </View>
          <Text style={styles.name}>{spell.name}</Text>
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </Pressable>

      <View style={styles.statsRow}>
        <StatPill label="Time" value={spell.casting_time} />
        <StatPill label="Range" value={spell.range} />
        <StatPill label="Components" value={spell.components} />
        <StatPill label="Duration" value={spell.duration} />
      </View>

      {expanded && spell.description ? (
        <Text style={styles.description}>{spell.description}</Text>
      ) : null}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DnDColors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DnDColors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  levelBadge: {
    backgroundColor: DnDColors.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    color: DnDColors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  removeText: {
    color: DnDColors.danger,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillLabel: {
    color: DnDColors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  pillValue: {
    color: DnDColors.text,
    fontSize: 12,
  },
  description: {
    color: DnDColors.textMuted,
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
});
