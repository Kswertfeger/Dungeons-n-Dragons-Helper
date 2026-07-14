import { InputField } from '@/components/input-field';
import { InventoryItemRow } from '@/components/inventory-item-row';
import { PrimaryButton } from '@/components/primary-button';
import { Toast } from '@/components/toast';
import { DnDColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api, type Character, type DamageType, type InventoryItem, type ItemType } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InventoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const charId = parseInt(id);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', item_type: 'other' as ItemType, weight: '0', quantity: '1',
    equipped: false, armor_class_bonus: '0',
    damage_dice: '', damage_type: '' as DamageType, damage_bonus: '0',
  });

  const load = useCallback(async () => {
    if (!token) return;
    const [data, char] = await Promise.all([
      api.getInventory(token, charId),
      api.getCharacter(token, charId),
    ]);
    setItems(data);
    setCharacter(char);
    setLoading(false);
  }, [token, charId]);

  useEffect(() => { load(); }, [load]);

  const totalWeightNum = items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
  const totalWeight = totalWeightNum.toFixed(1);
  const carryCapacity = character ? character.strength * 15 : 0;
  const weightPercent = carryCapacity > 0 ? Math.min(totalWeightNum / carryCapacity, 1) : 0;
  const weightColor = weightPercent > 0.9 ? DnDColors.danger : weightPercent > 0.66 ? '#E67E22' : DnDColors.success;

  const handleAddItem = async () => {
    if (!form.name.trim() || !token) return;
    try {
      const item = await api.addItem(token, charId, {
        name: form.name.trim(),
        item_type: form.item_type,
        weight: parseFloat(form.weight) || 0,
        quantity: parseInt(form.quantity) || 1,
        equipped: form.equipped,
        armor_class_bonus: parseInt(form.armor_class_bonus) || 0,
        damage_dice: form.damage_dice.trim(),
        damage_type: form.damage_type,
        damage_bonus: parseInt(form.damage_bonus) || 0,
      });
      setItems((prev) => [...prev, item]);
      setShowModal(false);
      setForm({ name: '', item_type: 'other', weight: '0', quantity: '1', equipped: false, armor_class_bonus: '0', damage_dice: '', damage_type: '', damage_bonus: '0' });
      setToast('Item added!');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add item.');
    }
  };

  const handleUpdateQty = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(1, item.quantity + delta);
    if (newQty === item.quantity || !token) return;
    const updated = await api.updateItem(token, charId, item.id, { quantity: newQty });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleEquip = async (item: InventoryItem) => {
    if (!token) return;
    const updated = await api.updateItem(token, charId, item.id, { equipped: !item.equipped });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert('Remove Item', `Remove ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          if (!token) return;
          await api.deleteItem(token, charId, item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        },
      },
    ]);
  };

  const equipped = items.filter((i) => i.equipped);
  const stored = items.filter((i) => !i.equipped);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace(`/character/${id}`)}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={20} color={DnDColors.text} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.weight}>
            {totalWeight} / {carryCapacity} lbs
          </Text>
          <View style={styles.weightBarBg}>
            <View style={[styles.weightBarFill, { width: `${weightPercent * 100}%` as any, backgroundColor: weightColor }]} />
          </View>
        </View>
        <Pressable onPress={() => setShowModal(true)} style={styles.addBtn}>
          <MaterialIcons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Item</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={DnDColors.accent} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {equipped.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Equipped Items</Text>
              {equipped.map((item) => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  onIncrease={() => handleUpdateQty(item, 1)}
                  onDecrease={() => handleUpdateQty(item, -1)}
                  onDelete={() => handleDelete(item)}
                  onEquip={() => handleEquip(item)}
                />
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stored Items</Text>
            {stored.map((item) => (
              <InventoryItemRow
                key={item.id}
                item={item}
                onIncrease={() => handleUpdateQty(item, 1)}
                onDecrease={() => handleUpdateQty(item, -1)}
                onDelete={() => handleDelete(item)}
                onEquip={() => handleEquip(item)}
              />
            ))}
            {stored.length === 0 && equipped.length === 0 && (
              <Text style={styles.emptyText}>No items yet. Tap Add Item to get started.</Text>
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={20} color={DnDColors.textMuted} />
              </Pressable>
            </View>

            <InputField
              label="Item Name *"
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="e.g. Longsword"
            />

            <Text style={styles.pickerLabel}>Type</Text>
            <View style={styles.typeRow}>
              {(['weapon', 'armor', 'shield', 'other'] as ItemType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setForm((p) => ({ ...p, item_type: t }))}
                  style={[styles.typeChip, form.item_type === t && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipText, form.item_type === t && styles.typeChipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <InputField
                  label="Weight (lbs)"
                  value={form.weight}
                  onChangeText={(v) => setForm((p) => ({ ...p, weight: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={styles.half}>
                <InputField
                  label="Quantity"
                  value={form.quantity}
                  onChangeText={(v) => setForm((p) => ({ ...p, quantity: v }))}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
            </View>

            {(form.item_type === 'armor' || form.item_type === 'shield') && (
              <InputField
                label="AC Bonus"
                value={form.armor_class_bonus}
                onChangeText={(v) => setForm((p) => ({ ...p, armor_class_bonus: v }))}
                keyboardType="numeric"
                placeholder="0"
              />
            )}

            {form.item_type === 'weapon' && (
              <>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <InputField
                      label="Damage Dice"
                      value={form.damage_dice}
                      onChangeText={(v) => setForm((p) => ({ ...p, damage_dice: v }))}
                      placeholder="e.g. 1d8"
                    />
                  </View>
                  <View style={styles.half}>
                    <InputField
                      label="Magic Bonus"
                      value={form.damage_bonus}
                      onChangeText={(v) => setForm((p) => ({ ...p, damage_bonus: v }))}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                </View>

                <Text style={styles.pickerLabel}>Damage Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.damageTypeScroll}>
                  {(['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning', 'poison', 'acid', 'thunder', 'necrotic', 'radiant', 'force', 'psychic'] as DamageType[]).map((dt) => (
                    <Pressable
                      key={dt}
                      onPress={() => setForm((p) => ({ ...p, damage_type: p.damage_type === dt ? '' : dt }))}
                      style={[styles.typeChip, form.damage_type === dt && styles.typeChipActive]}
                    >
                      <Text style={[styles.typeChipText, form.damage_type === dt && styles.typeChipTextActive]}>
                        {dt.charAt(0).toUpperCase() + dt.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Equipped</Text>
              <Switch
                value={form.equipped}
                onValueChange={(v) => setForm((p) => ({ ...p, equipped: v }))}
                trackColor={{ false: DnDColors.border, true: DnDColors.accent }}
                thumbColor="#fff"
              />
            </View>

            <PrimaryButton label="Add Item" onPress={handleAddItem} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>

      <Toast message={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DnDColors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border,
  },
  backBtn: { padding: 4 },
  titleBlock: { flex: 1 },
  title: { color: DnDColors.text, fontSize: 18, fontWeight: '700' },
  weight: { color: DnDColors.textMuted, fontSize: 11, marginTop: 1 },
  weightBarBg: {
    height: 4, width: '100%', backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 2, marginTop: 4, overflow: 'hidden',
  },
  weightBarFill: { height: '100%', borderRadius: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: DnDColors.accent, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  emptyText: { color: DnDColors.textMuted, textAlign: 'center', marginTop: 20 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: DnDColors.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 20,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { color: DnDColors.text, fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  pickerLabel: {
    color: DnDColors.textMuted, fontSize: 12, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  damageTypeScroll: { marginBottom: 12 },
  typeChip: {
    flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center',
    backgroundColor: DnDColors.surfaceRaised,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  typeChipActive: { backgroundColor: DnDColors.accent, borderColor: DnDColors.accent },
  typeChipText: { color: DnDColors.textMuted, fontSize: 13 },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8,
  },
  switchLabel: { color: DnDColors.text, fontSize: 15 },
});
