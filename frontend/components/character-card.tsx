import { DnDColors } from '@/constants/colors';
import { type Character } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  character: Character;
  onPress: () => void;
  onDelete: () => void;
};

export function CharacterCard({ character, onPress, onDelete }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialIcons name="person" size={16} color={DnDColors.accentLight} />
          <Text style={styles.name} numberOfLines={1}>{character.name}</Text>
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <MaterialIcons name="delete" size={16} color={DnDColors.danger} />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        Level {character.level} {character.race} {character.character_class}
      </Text>

      <View style={styles.stats}>
        <StatChip label="HP" value={`${character.hp_current}/${character.hp_max}`} />
        <StatChip label="AC" value={String(character.armor_class)} />
        <StatChip label="XP" value={String(character.xp)} />
      </View>
    </Pressable>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

export function CreateCharacterCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, styles.createCard, pressed && styles.pressed]}>
      <MaterialIcons name="add" size={32} color={DnDColors.accentLight} />
      <Text style={styles.createText}>Create New Character</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: DnDColors.surface,
    borderRadius: 12,
    padding: 14,
    margin: 6,
    borderWidth: 1,
    borderColor: DnDColors.border,
    minHeight: 140,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  name: {
    color: DnDColors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  subtitle: {
    color: DnDColors.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chipLabel: {
    color: DnDColors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chipValue: {
    color: DnDColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  createCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: DnDColors.accentLight,
  },
  createText: {
    color: DnDColors.accentLight,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});
