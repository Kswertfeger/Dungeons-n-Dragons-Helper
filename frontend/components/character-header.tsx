import { PrimaryButton } from '@/components/primary-button';
import { DnDColors } from '@/constants/colors';
import { type Character } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  character: Character;
  editing: boolean;
  saving: boolean;
  canLevelUp: boolean;
  onSwitchCharacter: () => void;
  onEdit: () => void;
  onSave: () => void;
  onLevelUp: () => void;
};

export function CharacterHeader({
  character, editing, saving, canLevelUp,
  onSwitchCharacter, onEdit, onSave, onLevelUp,
}: Props) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onSwitchCharacter} style={styles.switchBtn}>
        <MaterialIcons name="swap-horiz" size={16} color={DnDColors.accentLight} />
        <Text style={styles.switchText}>Switch Character</Text>
      </Pressable>

      <View style={styles.nameRow}>
        <View style={styles.headerCenter}>
          <Text style={styles.charName}>{character.name}</Text>
          <Text style={styles.charMeta}>
            Level {character.level} · {character.race} {character.character_class}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {editing ? (
            <PrimaryButton label="Save" onPress={onSave} loading={saving} style={styles.editBtn} />
          ) : (
            <>
              {canLevelUp && (
                <Pressable onPress={onLevelUp} style={styles.levelUpBtn}>
                  <MaterialIcons name="arrow-upward" size={12} color={DnDColors.success} />
                  <Text style={styles.levelUpBtnText}>Level Up</Text>
                </Pressable>
              )}
              <Pressable onPress={onEdit} style={styles.editBtnOutline}>
                <MaterialIcons name="edit" size={14} color={DnDColors.accentLight} />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border,
    gap: 10,
  },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
  },
  switchText: { color: DnDColors.accentLight, fontSize: 13, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCenter: { flex: 1 },
  charName: { color: DnDColors.text, fontSize: 18, fontWeight: '700' },
  charMeta: { color: DnDColors.textMuted, fontSize: 12, marginTop: 1 },
  headerActions: { alignItems: 'flex-end', gap: 6, flexDirection: 'row' },
  editBtn: { paddingVertical: 6, paddingHorizontal: 14 },
  editBtnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 6, borderWidth: 1, borderColor: DnDColors.accentLight,
  },
  editBtnText: { color: DnDColors.accentLight, fontSize: 13, fontWeight: '600' },
  levelUpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: DnDColors.success + '66',
    backgroundColor: DnDColors.success + '11',
  },
  levelUpBtnText: { color: DnDColors.success, fontSize: 11, fontWeight: '700' },
});
