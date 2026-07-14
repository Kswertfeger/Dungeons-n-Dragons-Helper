import { DnDColors } from '@/constants/colors';
import { type InventoryItem } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  item: InventoryItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onDelete: () => void;
  onEquip: () => void;
};

export function InventoryItemRow({ item, onIncrease, onDecrease, onDelete, onEquip }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.armor_class_bonus !== 0 && (
            <View style={styles.acBadge}>
              <Text style={styles.acBadgeText}>
                AC {item.armor_class_bonus > 0 ? `+${item.armor_class_bonus}` : item.armor_class_bonus}
              </Text>
            </View>
          )}
        </View>
        {item.item_type === 'weapon' && item.damage_dice ? (
          <Text style={styles.damage}>
            {item.damage_dice}
            {item.damage_bonus !== 0 ? (item.damage_bonus > 0 ? `+${item.damage_bonus}` : item.damage_bonus) : ''}
            {item.damage_type ? ` · ${item.damage_type}` : ''}
          </Text>
        ) : null}
        <Text style={styles.weight}>
          {item.weight > 0 ? `${item.weight} × ${item.quantity} = ${(item.weight * item.quantity).toFixed(1)} lbs` : ''}
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={onEquip} style={styles.equipBtn} hitSlop={4}>
          <MaterialIcons
            name="shield"
            size={18}
            color={item.equipped ? DnDColors.accentLight : DnDColors.textDisabled}
          />
        </Pressable>
        <Pressable onPress={onDecrease} style={styles.stepper} hitSlop={4}>
          <Text style={styles.stepperText}>−</Text>
        </Pressable>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Pressable onPress={onIncrease} style={styles.stepper} hitSlop={4}>
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={4}>
          <MaterialIcons name="delete" size={16} color={DnDColors.danger} />
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: DnDColors.border,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: DnDColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  acBadge: {
    backgroundColor: DnDColors.accent + '33',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: DnDColors.accentLight + '88',
  },
  acBadgeText: {
    color: DnDColors.accentLight,
    fontSize: 11,
    fontWeight: '700',
  },
  damage: {
    color: DnDColors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  weight: {
    color: DnDColors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepper: {
    backgroundColor: DnDColors.surfaceRaised,
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    color: DnDColors.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  quantity: {
    color: DnDColors.text,
    fontSize: 15,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  equipBtn: {
    marginRight: 4,
  },
  deleteBtn: {
    marginLeft: 4,
  },
});
