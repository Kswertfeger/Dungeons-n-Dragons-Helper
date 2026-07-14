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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SPELL_LEVELS = [
  { label: 'Cantrip', value: 0 },
  ...Array.from({ length: 9 }, (_, i) => ({ label: `Level ${i + 1}`, value: i + 1 })),
];

const BLANK_FORM = {
  name: '', level: 0, casting_time: '1 action', range: '30 feet',
  components: 'V, S', duration: 'Instantaneous', description: '',
  requires_concentration: false,
};

export default function SpellsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const charId = parseInt(id);

  const [spells, setSpells] = useState<Spell[]>([]);
  const [slots, setSlots] = useState<SpellSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [slotDraft, setSlotDraft] = useState<Record<number, string>>({});
  const [savingSlots, setSavingSlots] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeConcentrationId, setActiveConcentrationId] = useState<number | null>(null);

  const [form, setForm] = useState(BLANK_FORM);

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
      setForm(BLANK_FORM);
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
          if (activeConcentrationId === spell.id) setActiveConcentrationId(null);
        },
      },
    ]);
  };

  const doCast = async (spell: Spell, slot: SpellSlot) => {
    if (!token) return;
    try {
      const updated = await api.updateSpellSlot(token, charId, slot.id, { used: slot.used + 1 });
      setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (spell.requires_concentration) setActiveConcentrationId(spell.id);
      setToast(`Cast ${spell.name}!`);
    } catch {
      setToast('Failed to cast spell.');
    }
  };

  const handleCast = (spell: Spell) => {
    const availableSlot = slots
      .filter((s) => s.slot_level >= spell.level && s.remaining > 0)
      .sort((a, b) => a.slot_level - b.slot_level)[0];

    if (!availableSlot) {
      setToast('No spell slots remaining!');
      return;
    }

    if (spell.requires_concentration && activeConcentrationId && activeConcentrationId !== spell.id) {
      const current = spells.find((s) => s.id === activeConcentrationId);
      Alert.alert(
        'Break Concentration?',
        `You are concentrating on ${current?.name ?? 'another spell'}. Cast ${spell.name} and break concentration?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Cast', onPress: () => doCast(spell, availableSlot) },
        ],
      );
      return;
    }

    doCast(spell, availableSlot);
  };

  const openSlotsModal = () => {
    const draft: Record<number, string> = {};
    for (let lvl = 1; lvl <= 9; lvl++) {
      const existing = slots.find((s) => s.slot_level === lvl);
      draft[lvl] = existing ? String(existing.total) : '0';
    }
    setSlotDraft(draft);
    setShowSlotsModal(true);
  };

  const handleSaveSlots = async () => {
    if (!token) return;
    setSavingSlots(true);
    try {
      const ops = Array.from({ length: 9 }, (_, i) => i + 1).map(async (lvl) => {
        const total = parseInt(slotDraft[lvl]) || 0;
        const existing = slots.find((s) => s.slot_level === lvl);
        if (existing) {
          if (existing.total !== total) {
            return api.updateSpellSlot(token, charId, existing.id, {
              total,
              used: Math.min(existing.used, total),
            });
          }
        } else if (total > 0) {
          return api.createSpellSlot(token, charId, { slot_level: lvl, total, used: 0 });
        }
      });
      await Promise.all(ops);
      await load();
      setShowSlotsModal(false);
      setToast('Spell slots updated!');
    } finally {
      setSavingSlots(false);
    }
  };

  const handleLongRest = async () => {
    if (!token || slots.length === 0) return;
    await Promise.all(slots.map((s) => api.updateSpellSlot(token, charId, s.id, { used: 0 })));
    await load();
    setToast('Long rest taken! Spell slots restored.');
  };

  const concentratingSpell = spells.find((s) => s.id === activeConcentrationId);
  const cantrips = spells.filter((s) => s.level === 0);
  const leveled = Array.from({ length: 9 }, (_, i) => i + 1)
    .map((lvl) => ({ level: lvl, spells: spells.filter((s) => s.level === lvl) }))
    .filter((g) => g.spells.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace(`/character/${id}`)}
          style={styles.backBtn}
        >
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
          {/* Concentration banner */}
          {concentratingSpell && (
            <View style={styles.concBanner}>
              <MaterialIcons name="brightness-1" size={10} color={DnDColors.accentLight} />
              <Text style={styles.concBannerText}>
                Concentrating: <Text style={styles.concBannerSpell}>{concentratingSpell.name}</Text>
              </Text>
              <Pressable onPress={() => setActiveConcentrationId(null)} style={styles.concEndBtn}>
                <Text style={styles.concEndText}>End</Text>
              </Pressable>
            </View>
          )}

          {/* Spell Slots */}
          <View style={styles.sectionCard}>
            <View style={styles.slotHeader}>
              <Text style={styles.sectionTitle}>Spell Slots</Text>
              <Pressable onPress={openSlotsModal} style={styles.editSlotsBtn}>
                <MaterialIcons name="edit" size={13} color={DnDColors.accentLight} />
                <Text style={styles.editSlotsBtnText}>Edit</Text>
              </Pressable>
            </View>
            {slots.filter((s) => s.total > 0).length > 0 ? (
              slots.filter((s) => s.total > 0).map((slot) => (
                <View key={slot.id} style={styles.slotRow}>
                  <Text style={styles.slotLabel}>Level {slot.slot_level}</Text>
                  <View style={styles.pips}>
                    {Array.from({ length: slot.total }, (_, i) => (
                      <View key={i} style={[styles.pip, i < slot.remaining ? styles.pipFull : styles.pipEmpty]} />
                    ))}
                  </View>
                  <Text style={styles.slotCount}>{slot.remaining}/{slot.total}</Text>
                </View>
              ))
            ) : (
              <Pressable onPress={openSlotsModal} style={styles.noSlotsPrompt}>
                <MaterialIcons name="add-circle-outline" size={18} color={DnDColors.accentLight} />
                <Text style={styles.noSlotsText}>Tap to configure spell slots</Text>
              </Pressable>
            )}
          </View>

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
                <SpellCard
                  key={s.id}
                  spell={s}
                  onDelete={() => handleDeleteSpell(s)}
                  onCast={() => handleCast(s)}
                  isConcentrating={activeConcentrationId === s.id}
                />
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

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Requires Concentration</Text>
                <Switch
                  value={form.requires_concentration}
                  onValueChange={(v) => setForm((p) => ({ ...p, requires_concentration: v }))}
                  trackColor={{ false: DnDColors.border, true: DnDColors.accent }}
                  thumbColor="#fff"
                />
              </View>

              <PrimaryButton label="Add Spell" onPress={handleAddSpell} style={{ marginTop: 8 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Configure Slots Modal */}
      <Modal visible={showSlotsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Spell Slots</Text>
              <Pressable onPress={() => setShowSlotsModal(false)}>
                <MaterialIcons name="close" size={20} color={DnDColors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((lvl) => (
                <View key={lvl} style={styles.slotDraftRow}>
                  <Text style={styles.slotDraftLabel}>Level {lvl}</Text>
                  <View style={styles.slotDraftStepper}>
                    <Pressable
                      onPress={() => setSlotDraft((p) => ({ ...p, [lvl]: String(Math.max(0, (parseInt(p[lvl]) || 0) - 1)) }))}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <TextInput
                      style={styles.slotDraftInput}
                      value={slotDraft[lvl] ?? '0'}
                      onChangeText={(v) => setSlotDraft((p) => ({ ...p, [lvl]: v }))}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <Pressable
                      onPress={() => setSlotDraft((p) => ({ ...p, [lvl]: String((parseInt(p[lvl]) || 0) + 1) }))}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
              <PrimaryButton
                label={savingSlots ? 'Saving…' : 'Save Slots'}
                onPress={handleSaveSlots}
                loading={savingSlots}
                style={{ marginTop: 12 }}
              />
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
  concBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: DnDColors.accent + '22',
    borderRadius: 8, padding: 10, marginBottom: 14,
    borderWidth: 1, borderColor: DnDColors.accentLight + '55',
  },
  concBannerText: { color: DnDColors.textMuted, fontSize: 13, flex: 1 },
  concBannerSpell: { color: DnDColors.accentLight, fontWeight: '700' },
  concEndBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: DnDColors.surfaceRaised, borderRadius: 5,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  concEndText: { color: DnDColors.textMuted, fontSize: 12, fontWeight: '600' },
  sectionCard: {
    backgroundColor: DnDColors.surface, borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  sectionTitle: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  editSlotsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editSlotsBtnText: { color: DnDColors.accentLight, fontSize: 12, fontWeight: '600' },
  noSlotsPrompt: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  noSlotsText: { color: DnDColors.accentLight, fontSize: 13 },
  slotDraftRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DnDColors.border + '60',
  },
  slotDraftLabel: { color: DnDColors.text, fontSize: 15 },
  slotDraftStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    backgroundColor: DnDColors.surfaceRaised, width: 32, height: 32,
    borderRadius: 6, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { color: DnDColors.text, fontSize: 18, fontWeight: '600', lineHeight: 22 },
  slotDraftInput: {
    color: DnDColors.text, fontSize: 16, fontWeight: '700',
    textAlign: 'center', minWidth: 32,
  },
  slotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
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
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  switchLabel: { color: DnDColors.text, fontSize: 15 },
});
