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
};

export function InventoryItemRow({ item, onIncrease, onDecrease, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.weight}>
          Weight: {item.weight} × {item.quantity} = {(item.weight * item.quantity).toFixed(1)} lbs
        </Text>
      </View>

      <View style={styles.controls}>
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
  name: {
    color: DnDColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  weight: {
    color: DnDColors.textMuted,
    fontSize: 12,
    marginTop: 2,
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
  deleteBtn: {
    marginLeft: 4,
  },
});
