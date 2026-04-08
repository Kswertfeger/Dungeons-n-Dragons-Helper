import { InputField } from '@/components/input-field';
import { PrimaryButton } from '@/components/primary-button';
import { SpellCard } from '@/components/spell-card';
import { Toast } from '@/components/toast';
import { DnDColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api, type Spell, type SpellSlot } from '@/services/api';
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
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SPELL_LEVELS = [
  { label: 'Cantrip', value: 0 },
  ...Array.from({ length: 9 }, (_, i) => ({ label: `Level ${i + 1}`, value: i + 1 })),
];

export default function SpellsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const charId = parseInt(id);

  const [spells, setSpells] = useState<Spell[]>([]);
  const [slots, setSlots] = useState<SpellSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', level: 0, casting_time: '1 action', range: '30 feet',
    components: 'V, S', duration: 'Instantaneous', description: '',
  });

  const load = useCallback(async () => {
    if (!token) return;
    const [s, sl] = await Promise.all([
      api.getSpells(token, charId),
      api.getSpellSlots(token, charId),
    ]);
    setSpells(s);
    setSlots(sl);
    setLoading(false);
  }, [token, charId]);

  useEffect(() => { load(); }, [load]);

  const handleAddSpell = async () => {
    if (!form.name.trim() || !token) return;
    try {
      const spell = await api.addSpell(token, charId, form);
      setSpells((prev) => [...prev, spell]);
      setShowModal(false);
      setForm({ name: '', level: 0, casting_time: '1 action', range: '30 feet', components: 'V, S', duration: 'Instantaneous', description: '' });
      setToast('Spell added successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to add spell.');
    }
  };

  const handleDeleteSpell = (spell: Spell) => {
    Alert.alert('Remove Spell', `Remove ${spell.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          if (!token) return;
          await api.deleteSpell(token, charId, spell.id);
          setSpells((prev) => prev.filter((s) => s.id !== spell.id));
        },
      },
    ]);
  };

  const handleLongRest = async () => {
    if (!token || slots.length === 0) return;
    await Promise.all(slots.map((s) => api.updateSpellSlot(token, charId, s.id, { used: 0 })));
    await load();
    setToast('Long rest taken! Spell slots restored.');
  };

  const cantrips = spells.filter((s) => s.level === 0);
  const leveled = Array.from({ length: 9 }, (_, i) => i + 1)
    .map((lvl) => ({ level: lvl, spells: spells.filter((s) => s.level === lvl) }))
    .filter((g) => g.spells.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color={DnDColors.text} />
        </Pressable>
        <Text style={styles.title}>Spells & Spell Slots</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleLongRest} style={styles.restBtn}>
            <Text style={styles.restBtnText}>Long Rest</Text>
          </Pressable>
          <Pressable onPress={() => setShowModal(true)} style={styles.addBtn}>
            <MaterialIcons name="add" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={DnDColors.accent} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Spell Slots */}
          {slots.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Spell Slots</Text>
              {slots.map((slot) => (
                <View key={slot.id} style={styles.slotRow}>
                  <Text style={styles.slotLabel}>Level {slot.slot_level}</Text>
                  <View style={styles.pips}>
                    {Array.from({ length: slot.total }, (_, i) => (
                      <View
                        key={i}
                        style={[styles.pip, i < slot.remaining ? styles.pipFull : styles.pipEmpty]}
                      />
                    ))}
                  </View>
                  <Text style={styles.slotCount}>{slot.remaining}/{slot.total}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Cantrips */}
          {cantrips.length > 0 && (
            <View style={styles.spellGroup}>
              <Text style={styles.groupTitle}>Cantrips</Text>
              {cantrips.map((s) => (
                <SpellCard key={s.id} spell={s} onDelete={() => handleDeleteSpell(s)} />
              ))}
            </View>
          )}

          {/* Leveled spells */}
          {leveled.map(({ level, spells: ls }) => (
            <View key={level} style={styles.spellGroup}>
              <Text style={styles.groupTitle}>Level {level} Spells</Text>
              {ls.map((s) => (
                <SpellCard key={s.id} spell={s} onDelete={() => handleDeleteSpell(s)} />
              ))}
            </View>
          ))}

          {spells.length === 0 && (
            <Text style={styles.emptyText}>No spells yet. Tap + to add one.</Text>
          )}
        </ScrollView>
      )}

      {/* Add Spell Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Spell</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={20} color={DnDColors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <InputField label="Spell Name *" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Fireball" />

              <Text style={styles.pickerLabel}>Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelPicker}>
                {SPELL_LEVELS.map(({ label, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setForm((p) => ({ ...p, level: value }))}
                    style={[styles.levelChip, form.level === value && styles.levelChipActive]}
                  >
                    <Text style={[styles.levelChipText, form.level === value && styles.levelChipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <InputField label="Casting Time" value={form.casting_time} onChangeText={(v) => setForm((p) => ({ ...p, casting_time: v }))} placeholder="1 action" />
              <InputField label="Range" value={form.range} onChangeText={(v) => setForm((p) => ({ ...p, range: v }))} placeholder="30 feet" />
              <InputField label="Components" value={form.components} onChangeText={(v) => setForm((p) => ({ ...p, components: v }))} placeholder="V, S" />
              <InputField label="Duration" value={form.duration} onChangeText={(v) => setForm((p) => ({ ...p, duration: v }))} placeholder="Instantaneous" />
              <InputField label="Description" value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Spell description..." multiline numberOfLines={3} />

              <PrimaryButton label="Add Spell" onPress={handleAddSpell} style={{ marginTop: 8 }} />
            </ScrollView>
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
  title: { color: DnDColors.text, fontSize: 18, fontWeight: '700', flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  restBtn: {
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: DnDColors.surface, borderRadius: 6,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  restBtnText: { color: DnDColors.textMuted, fontSize: 12, fontWeight: '600' },
  addBtn: {
    backgroundColor: DnDColors.accent, width: 32, height: 32,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 16, paddingBottom: 32 },
  sectionCard: {
    backgroundColor: DnDColors.surface, borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  sectionTitle: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10,
  },
  slotLabel: { color: DnDColors.textMuted, fontSize: 13, width: 56 },
  pips: { flexDirection: 'row', gap: 4, flex: 1 },
  pip: { width: 10, height: 10, borderRadius: 5 },
  pipFull: { backgroundColor: DnDColors.accentLight },
  pipEmpty: { backgroundColor: DnDColors.border },
  slotCount: { color: DnDColors.textMuted, fontSize: 12, width: 32, textAlign: 'right' },
  spellGroup: { marginBottom: 16 },
  groupTitle: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  emptyText: { color: DnDColors.textMuted, textAlign: 'center', marginTop: 40 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: DnDColors.surface, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 20, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { color: DnDColors.text, fontSize: 18, fontWeight: '700' },
  pickerLabel: {
    color: DnDColors.textMuted, fontSize: 12, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  levelPicker: { marginBottom: 12 },
  levelChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: DnDColors.surfaceRaised, marginRight: 6,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  levelChipActive: { backgroundColor: DnDColors.accent, borderColor: DnDColors.accent },
  levelChipText: { color: DnDColors.textMuted, fontSize: 13 },
  levelChipTextActive: { color: '#fff', fontWeight: '600' },
});
