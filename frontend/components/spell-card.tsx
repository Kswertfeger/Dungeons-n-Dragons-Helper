import { DnDColors } from '@/constants/colors';
import { type Spell } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  spell: Spell;
  onDelete: () => void;
  onCast?: () => void;
  isConcentrating?: boolean;
};

export function SpellCard({ spell, onDelete, onCast, isConcentrating }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isCantrip = spell.level === 0;

  return (
    <View style={[styles.card, isConcentrating && styles.cardConcentrating]}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{isCantrip ? 'C' : spell.level}</Text>
          </View>
          <Text style={styles.name}>{spell.name}</Text>
          {spell.requires_concentration && (
            <View style={styles.concBadge}>
              <MaterialIcons name="brightness-1" size={8} color={DnDColors.accentLight} />
              <Text style={styles.concBadgeText}>Conc</Text>
            </View>
          )}
          {isConcentrating && (
            <View style={styles.activeConcBadge}>
              <Text style={styles.activeConcText}>CONCENTRATING</Text>
            </View>
          )}
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

      {!isCantrip && onCast && (
        <Pressable onPress={onCast} style={styles.castBtn}>
          <MaterialIcons name="flash-on" size={13} color="#fff" />
          <Text style={styles.castBtnText}>Cast</Text>
        </Pressable>
      )}
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
  cardConcentrating: {
    borderColor: DnDColors.accentLight,
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
    gap: 6,
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
  concBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: DnDColors.accent + '33',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  concBadgeText: {
    color: DnDColors.accentLight,
    fontSize: 10,
    fontWeight: '700',
  },
  activeConcBadge: {
    backgroundColor: DnDColors.accentLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  activeConcText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  castBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    backgroundColor: DnDColors.accent,
    borderRadius: 6,
    paddingVertical: 7,
  },
  castBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
