import { CharacterDiceOverlay } from '@/components/character-dice-overlay';
import { CharacterHeader } from '@/components/character-header';
import { InputField } from '@/components/input-field';
import { InventoryItemRow } from '@/components/inventory-item-row';
import { PrimaryButton } from '@/components/primary-button';
import { SpellCard } from '@/components/spell-card';
import { StatBlock } from '@/components/stat-block';
import { TabSwitcher } from '@/components/tab-switcher';
import { Toast } from '@/components/toast';
import { DnDColors } from '@/constants/colors';
import { CLASSES } from '@/constants/dnd-data';
import { useAuth } from '@/context/auth-context';
import {
  api,
  type Character,
  type DamageType,
  type InventoryItem,
  type ItemType,
  type Spell,
  type SpellSlot,
} from '@/services/api';
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

const STAT_TABS = ['Stats', 'Skills', 'Combat', 'Spells', 'Inventory'];

const SKILLS: { name: string; stat: keyof Character }[] = [
  { name: 'Acrobatics', stat: 'dexterity_modifier' },
  { name: 'Animal Handling', stat: 'wisdom_modifier' },
  { name: 'Arcana', stat: 'intelligence_modifier' },
  { name: 'Athletics', stat: 'strength_modifier' },
  { name: 'Deception', stat: 'charisma_modifier' },
  { name: 'History', stat: 'intelligence_modifier' },
  { name: 'Insight', stat: 'wisdom_modifier' },
  { name: 'Intimidation', stat: 'charisma_modifier' },
  { name: 'Investigation', stat: 'intelligence_modifier' },
  { name: 'Medicine', stat: 'wisdom_modifier' },
  { name: 'Nature', stat: 'intelligence_modifier' },
  { name: 'Perception', stat: 'wisdom_modifier' },
  { name: 'Performance', stat: 'charisma_modifier' },
  { name: 'Persuasion', stat: 'charisma_modifier' },
  { name: 'Religion', stat: 'intelligence_modifier' },
  { name: 'Sleight of Hand', stat: 'dexterity_modifier' },
  { name: 'Stealth', stat: 'dexterity_modifier' },
  { name: 'Survival', stat: 'wisdom_modifier' },
];

export default function CharacterSheetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Character>>({});
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    api.getCharacter(token, parseInt(id))
      .then((c) => {
        setCharacter(c);
        setEditForm(c);
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [token, id]);

  const proficiencyBonus = character ? Math.floor((character.level - 1) / 4) + 2 : 2;

  const setField = (key: keyof Character) => (val: string) =>
    setEditForm((prev) => ({ ...prev, [key]: val }));

  const setNumField = (key: keyof Character) => (val: string) =>
    setEditForm((prev) => ({ ...prev, [key]: parseInt(val) || 0 }));

  const handleToggleProficiency = async (skillName: string) => {
    if (!token || !character) return;
    const current = character.proficient_skills ?? [];
    const updated = current.includes(skillName)
      ? current.filter((s) => s !== skillName)
      : [...current, skillName];
    const newChar = await api.updateCharacter(token, character.id, { proficient_skills: updated } as any);
    setCharacter(newChar);
  };

  const handleSave = async () => {
    if (!token || !character) return;
    setSaving(true);
    try {
      const updated = await api.updateCharacter(token, character.id, editForm);
      setCharacter(updated);
      setEditing(false);
      setToast('Character saved!');
    } catch (e: any) {
      setToast(e.message ?? 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !character) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={DnDColors.accent} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  const mod = (v: number) => {
    const m = Math.floor((v - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <CharacterHeader
        character={character}
        editing={editing}
        saving={saving}
        canLevelUp={character.level < 20}
        onSwitchCharacter={() => router.replace('/')}
        onEdit={() => setEditing(true)}
        onSave={handleSave}
        onLevelUp={() => setShowLevelUp(true)}
      />

      <TabSwitcher tabs={STAT_TABS} activeIndex={activeTab} onChange={setActiveTab} scrollable />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 0 && (
          <StatsTab character={character} editing={editing} editForm={editForm} setField={setField} setNumField={setNumField} />
        )}
        {activeTab === 1 && (
          <SkillsTab
            character={character}
            proficiencyBonus={proficiencyBonus}
            onToggleProficiency={handleToggleProficiency}
          />
        )}
        {activeTab === 2 && (
          <CombatTab
            character={character}
            editing={editing}
            editForm={editForm}
            setNumField={setNumField}
            token={token!}
            onHpChange={setCharacter}
          />
        )}
        {activeTab === 3 && (
          <SpellsTab charId={character.id} token={token!} />
        )}
        {activeTab === 4 && (
          <InventoryTab charId={character.id} token={token!} character={character} />
        )}
      </ScrollView>

      <CharacterDiceOverlay character={character} token={token!} characterId={character.id} />

      <Toast message={toast} onHide={() => setToast(null)} />

      <LevelUpModal
        character={character}
        token={token!}
        visible={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        onSuccess={(updated) => {
          setCharacter(updated);
          setEditForm(updated);
          setToast(`Leveled up to ${updated.level}!`);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Level Up Modal ───────────────────────────────────────────────────────────

function LevelUpModal({ character, token, visible, onClose, onSuccess }: {
  character: Character;
  token: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: (updated: Character) => void;
}) {
  const [mode, setMode] = useState<'roll' | 'manual'>('roll');
  const [rolledHp, setRolledHp] = useState<number | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode('roll');
      setRolledHp(null);
      setManualInput('');
    }
  }, [visible]);

  const hitDie = CLASSES.find((c) => c.name === character.character_class)?.hitDie ?? 8;
  const newLevel = character.level + 1;
  const newProfBonus = Math.floor((newLevel - 1) / 4) + 2;
  const conMod = character.constitution_modifier;
  const conModStr = conMod >= 0 ? `+${conMod}` : `${conMod}`;

  const handleRoll = () => {
    const rolled = Math.ceil(Math.random() * hitDie);
    setRolledHp(Math.max(1, rolled + conMod));
  };

  const hpGain = mode === 'roll' ? (rolledHp ?? 0) : (parseInt(manualInput) || 0);
  const canConfirm = mode === 'roll' ? rolledHp !== null : parseInt(manualInput) > 0;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    try {
      const updated = await api.updateCharacter(token, character.id, {
        level: newLevel,
        hp_max: character.hp_max + hpGain,
        hp_current: character.hp_current + hpGain,
      });
      onSuccess(updated);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.luOverlay}>
        <View style={styles.luCard}>
          <View style={styles.luHeader}>
            <Text style={styles.luTitle}>Level Up!</Text>
            <Pressable onPress={onClose} style={styles.luClose}>
              <MaterialIcons name="close" size={20} color={DnDColors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.luLevelText}>
            Level {character.level} → {newLevel}
          </Text>
          <Text style={styles.luInfoText}>
            Roll 1d{hitDie} + CON ({conModStr}) for HP
          </Text>
          <Text style={styles.luInfoText}>
            Proficiency bonus is now +{newProfBonus}
          </Text>

          <View style={styles.luModeRow}>
            <Pressable
              onPress={() => setMode('roll')}
              style={[styles.luModeTab, mode === 'roll' && styles.luModeTabActive]}
            >
              <Text style={[styles.luModeText, mode === 'roll' && styles.luModeTextActive]}>
                Roll for HP
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('manual')}
              style={[styles.luModeTab, mode === 'manual' && styles.luModeTabActive]}
            >
              <Text style={[styles.luModeText, mode === 'manual' && styles.luModeTextActive]}>
                Manual Entry
              </Text>
            </Pressable>
          </View>

          {mode === 'roll' ? (
            <View style={styles.luRollSection}>
              {rolledHp !== null && (
                <Text style={styles.luRolledHp}>+{rolledHp} HP</Text>
              )}
              <Pressable onPress={handleRoll} style={styles.luRollBtn}>
                <MaterialIcons name="casino" size={16} color={DnDColors.accent} />
                <Text style={styles.luRollBtnText}>
                  {rolledHp !== null ? 'Re-roll' : 'Roll HP'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.luManualSection}>
              <Text style={styles.luManualLabel}>HP Gained</Text>
              <TextInput
                style={styles.luManualInput}
                value={manualInput}
                onChangeText={setManualInput}
                keyboardType="numeric"
                placeholder="e.g. 6"
                placeholderTextColor={DnDColors.textDisabled}
              />
            </View>
          )}

          <PrimaryButton
            label="Confirm Level Up"
            onPress={handleConfirm}
            loading={loading}
            disabled={!canConfirm}
            style={styles.luConfirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ character, editing, editForm, setField, setNumField }: {
  character: Character;
  editing: boolean;
  editForm: Partial<Character>;
  setField: (k: keyof Character) => (v: string) => void;
  setNumField: (k: keyof Character) => (v: string) => void;
}) {
  return (
    <>
      <SectionCard title="Basic Information">
        {editing ? (
          <>
            <InfoRow label="Level">
              <InputField label="" value={String(editForm.level ?? '')} onChangeText={setNumField('level')} keyboardType="numeric" style={{ marginBottom: 0 }} />
            </InfoRow>
            <InfoRow label="Race">
              <InputField label="" value={editForm.race ?? ''} onChangeText={setField('race')} style={{ marginBottom: 0 }} />
            </InfoRow>
            <InfoRow label="Class">
              <InputField label="" value={editForm.character_class ?? ''} onChangeText={setField('character_class')} style={{ marginBottom: 0 }} />
            </InfoRow>
            <InfoRow label="Background">
              <InputField label="" value={editForm.background ?? ''} onChangeText={setField('background')} style={{ marginBottom: 0 }} />
            </InfoRow>
            <InfoRow label="Alignment">
              <InputField label="" value={editForm.alignment ?? ''} onChangeText={setField('alignment')} style={{ marginBottom: 0 }} />
            </InfoRow>
            <InfoRow label="XP">
              <InputField label="" value={String(editForm.xp ?? '')} onChangeText={setNumField('xp')} keyboardType="numeric" style={{ marginBottom: 0 }} />
            </InfoRow>
          </>
        ) : (
          <>
            <InfoRow label="Level"><Text style={styles.infoValue}>{character.level}</Text></InfoRow>
            <InfoRow label="Race"><Text style={styles.infoValue}>{character.race}</Text></InfoRow>
            <InfoRow label="Class"><Text style={styles.infoValue}>{character.character_class}</Text></InfoRow>
            <InfoRow label="Background"><Text style={styles.infoValue}>{character.background || '—'}</Text></InfoRow>
            <InfoRow label="Alignment"><Text style={styles.infoValue}>{character.alignment || '—'}</Text></InfoRow>
            <InfoRow label="Experience Points"><Text style={styles.infoValue}>{character.xp}</Text></InfoRow>
          </>
        )}
      </SectionCard>

      <SectionCard title="Ability Scores">
        <View style={styles.statsGrid}>
          {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => (
            editing ? (
              <View key={stat} style={styles.statInputWrapper}>
                <InputField
                  label={stat.slice(0, 3).toUpperCase()}
                  value={String(editForm[stat] ?? '')}
                  onChangeText={setNumField(stat)}
                  keyboardType="numeric"
                  style={{ marginBottom: 0 }}
                />
              </View>
            ) : (
              <StatBlock key={stat} stat={stat.slice(0, 3).toUpperCase()} value={character[stat] as number} />
            )
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Saving Throws">
        {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => {
          const modKey = `${stat}_modifier` as keyof Character;
          const modVal = character[modKey] as number;
          const label = modVal >= 0 ? `+${modVal}` : `${modVal}`;
          return (
            <View key={stat} style={styles.savingThrowRow}>
              <Text style={styles.savingThrowName}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</Text>
              <Text style={styles.savingThrowMod}>{label}</Text>
            </View>
          );
        })}
      </SectionCard>
    </>
  );
}

// ─── Skills Tab ───────────────────────────────────────────────────────────────

function SkillsTab({ character, proficiencyBonus, onToggleProficiency }: {
  character: Character;
  proficiencyBonus: number;
  onToggleProficiency: (skillName: string) => void;
}) {
  const proficient = character.proficient_skills ?? [];
  return (
    <>
      <View style={styles.profBonusRow}>
        <Text style={styles.profBonusLabel}>Proficiency Bonus</Text>
        <Text style={styles.profBonusValue}>+{proficiencyBonus}</Text>
      </View>
      <SectionCard title="Skills  ·  tap dot to toggle proficiency">
        {SKILLS.map((skill) => {
          const baseVal = character[skill.stat] as number;
          const isProficient = proficient.includes(skill.name);
          const total = isProficient ? baseVal + proficiencyBonus : baseVal;
          const label = total >= 0 ? `+${total}` : `${total}`;
          return (
            <Pressable key={skill.name} style={styles.skillRow} onPress={() => onToggleProficiency(skill.name)}>
              <View style={[styles.skillDot, isProficient && styles.skillDotFilled]} />
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={[styles.skillMod, isProficient && styles.skillModProficient]}>{label}</Text>
            </Pressable>
          );
        })}
      </SectionCard>
    </>
  );
}

// ─── Combat Tab ───────────────────────────────────────────────────────────────

function CombatTab({ character, editing, editForm, setNumField, token, onHpChange }: {
  character: Character;
  editing: boolean;
  editForm: Partial<Character>;
  setNumField: (k: keyof Character) => (v: string) => void;
  token: string;
  onHpChange: (c: Character) => void;
}) {
  const [hpLoading, setHpLoading] = useState(false);
  const [hpInput, setHpInput] = useState('');

  const adjustHp = async (delta: number) => {
    const newHp = Math.max(0, Math.min(character.hp_max, character.hp_current + delta));
    if (newHp === character.hp_current) return;
    setHpLoading(true);
    try {
      const updated = await api.updateCharacter(token, character.id, { hp_current: newHp });
      onHpChange(updated);
    } finally {
      setHpLoading(false);
    }
  };

  const applyHpChange = async (type: 'damage' | 'heal') => {
    const amount = parseInt(hpInput) || 0;
    if (amount <= 0) return;
    await adjustHp(type === 'damage' ? -amount : amount);
    setHpInput('');
  };

  const hpPercent = character.hp_max > 0 ? character.hp_current / character.hp_max : 0;
  const hpColor = hpPercent > 0.5 ? DnDColors.success : hpPercent > 0.25 ? DnDColors.warning : DnDColors.danger;
  const passivePerception = 10 + character.wisdom_modifier;

  return (
    <>
      <SectionCard title="Hit Points">
        <View style={styles.hpRow}>
          <Pressable onPress={() => adjustHp(-1)} style={styles.hpBtn} disabled={hpLoading}>
            <Text style={styles.hpBtnText}>−</Text>
          </Pressable>
          <View style={styles.hpCenter}>
            <Text style={styles.hpValue}>
              {character.hp_current} <Text style={styles.hpMax}>/ {character.hp_max}</Text>
            </Text>
            <View style={styles.hpBarBg}>
              <View style={[styles.hpBarFill, { width: `${hpPercent * 100}%` as any, backgroundColor: hpColor }]} />
            </View>
          </View>
          <Pressable onPress={() => adjustHp(1)} style={styles.hpBtn} disabled={hpLoading}>
            <Text style={styles.hpBtnText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.hpBulkRow}>
          <Pressable
            onPress={() => applyHpChange('damage')}
            style={[styles.hpActionBtn, styles.damageBtn]}
            disabled={hpLoading}
          >
            <Text style={styles.hpActionText}>Damage</Text>
          </Pressable>
          <TextInput
            style={styles.hpBulkInput}
            value={hpInput}
            onChangeText={setHpInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={DnDColors.textDisabled}
            maxLength={4}
          />
          <Pressable
            onPress={() => applyHpChange('heal')}
            style={[styles.hpActionBtn, styles.healBtn]}
            disabled={hpLoading}
          >
            <Text style={styles.hpActionText}>Heal</Text>
          </Pressable>
        </View>

        {editing && (
          <InputField
            label="Max HP"
            value={String(editForm.hp_max ?? '')}
            onChangeText={setNumField('hp_max')}
            keyboardType="numeric"
            style={{ marginTop: 12, marginBottom: 0 }}
          />
        )}
      </SectionCard>

      <View style={styles.combatStats}>
        <CombatStat label="Armor Class" value={String(character.armor_class)} />
        <CombatStat label="Initiative" value={character.dexterity_modifier >= 0 ? `+${character.dexterity_modifier}` : `${character.dexterity_modifier}`} />
        <CombatStat label="Speed" value="30 ft" />
      </View>

      <SectionCard title="Senses">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Passive Perception</Text>
          <Text style={styles.infoValue}>{passivePerception}</Text>
        </View>
      </SectionCard>
    </>
  );
}

function CombatStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.combatStatBox}>
      <Text style={styles.combatStatValue}>{value}</Text>
      <Text style={styles.combatStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Spells Tab ───────────────────────────────────────────────────────────────

const SPELL_LEVELS = [
  { label: 'Cantrip', value: 0 },
  ...Array.from({ length: 9 }, (_, i) => ({ label: `Level ${i + 1}`, value: i + 1 })),
];

const BLANK_SPELL_FORM = {
  name: '', level: 0, casting_time: '1 action', range: '30 feet',
  components: 'V, S', duration: 'Instantaneous', description: '',
  requires_concentration: false,
};

function SpellsTab({ charId, token }: { charId: number; token: string }) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [slots, setSlots] = useState<SpellSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [slotDraft, setSlotDraft] = useState<Record<number, string>>({});
  const [savingSlots, setSavingSlots] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeConcentrationId, setActiveConcentrationId] = useState<number | null>(null);
  const [form, setForm] = useState(BLANK_SPELL_FORM);

  const load = useCallback(async () => {
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
    if (!form.name.trim()) return;
    try {
      const spell = await api.addSpell(token, charId, form);
      setSpells((prev) => [...prev, spell]);
      setShowModal(false);
      setForm(BLANK_SPELL_FORM);
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
          await api.deleteSpell(token, charId, spell.id);
          setSpells((prev) => prev.filter((s) => s.id !== spell.id));
          if (activeConcentrationId === spell.id) setActiveConcentrationId(null);
        },
      },
    ]);
  };

  const doCast = async (spell: Spell, slot: SpellSlot) => {
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
    if (slots.length === 0) return;
    await Promise.all(slots.map((s) => api.updateSpellSlot(token, charId, s.id, { used: 0 })));
    await load();
    setToast('Long rest taken! Spell slots restored.');
  };

  if (loading) {
    return <ActivityIndicator color={DnDColors.accent} style={{ marginTop: 40 }} />;
  }

  const concentratingSpell = spells.find((s) => s.id === activeConcentrationId);
  const cantrips = spells.filter((s) => s.level === 0);
  const leveled = Array.from({ length: 9 }, (_, i) => i + 1)
    .map((lvl) => ({ level: lvl, spells: spells.filter((s) => s.level === lvl) }))
    .filter((g) => g.spells.length > 0);

  return (
    <>
      <View style={spellStyles.header}>
        <Text style={spellStyles.title}>Spells &amp; Spell Slots</Text>
        <View style={spellStyles.headerActions}>
          <Pressable onPress={handleLongRest} style={spellStyles.restBtn}>
            <Text style={spellStyles.restBtnText}>Long Rest</Text>
          </Pressable>
          <Pressable onPress={() => setShowModal(true)} style={spellStyles.addBtn}>
            <MaterialIcons name="add" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>

      {concentratingSpell && (
        <View style={spellStyles.concBanner}>
          <MaterialIcons name="brightness-1" size={10} color={DnDColors.accentLight} />
          <Text style={spellStyles.concBannerText}>
            Concentrating: <Text style={spellStyles.concBannerSpell}>{concentratingSpell.name}</Text>
          </Text>
          <Pressable onPress={() => setActiveConcentrationId(null)} style={spellStyles.concEndBtn}>
            <Text style={spellStyles.concEndText}>End</Text>
          </Pressable>
        </View>
      )}

      <View style={spellStyles.sectionCard}>
        <View style={spellStyles.slotHeader}>
          <Text style={spellStyles.sectionTitle}>Spell Slots</Text>
          <Pressable onPress={openSlotsModal} style={spellStyles.editSlotsBtn}>
            <MaterialIcons name="edit" size={13} color={DnDColors.accentLight} />
            <Text style={spellStyles.editSlotsBtnText}>Edit</Text>
          </Pressable>
        </View>
        {slots.filter((s) => s.total > 0).length > 0 ? (
          slots.filter((s) => s.total > 0).map((slot) => (
            <View key={slot.id} style={spellStyles.slotRow}>
              <Text style={spellStyles.slotLabel}>Level {slot.slot_level}</Text>
              <View style={spellStyles.pips}>
                {Array.from({ length: slot.total }, (_, i) => (
                  <View key={i} style={[spellStyles.pip, i < slot.remaining ? spellStyles.pipFull : spellStyles.pipEmpty]} />
                ))}
              </View>
              <Text style={spellStyles.slotCount}>{slot.remaining}/{slot.total}</Text>
            </View>
          ))
        ) : (
          <Pressable onPress={openSlotsModal} style={spellStyles.noSlotsPrompt}>
            <MaterialIcons name="add-circle-outline" size={18} color={DnDColors.accentLight} />
            <Text style={spellStyles.noSlotsText}>Tap to configure spell slots</Text>
          </Pressable>
        )}
      </View>

      {cantrips.length > 0 && (
        <View style={spellStyles.spellGroup}>
          <Text style={spellStyles.groupTitle}>Cantrips</Text>
          {cantrips.map((s) => (
            <SpellCard key={s.id} spell={s} onDelete={() => handleDeleteSpell(s)} />
          ))}
        </View>
      )}

      {leveled.map(({ level, spells: ls }) => (
        <View key={level} style={spellStyles.spellGroup}>
          <Text style={spellStyles.groupTitle}>Level {level} Spells</Text>
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
        <Text style={spellStyles.emptyText}>No spells yet. Tap + to add one.</Text>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={spellStyles.modalOverlay}>
          <View style={spellStyles.modalCard}>
            <View style={spellStyles.modalHeader}>
              <Text style={spellStyles.modalTitle}>Add Spell</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={20} color={DnDColors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <InputField label="Spell Name *" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="e.g. Fireball" />

              <Text style={spellStyles.pickerLabel}>Level</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={spellStyles.levelPicker}>
                {SPELL_LEVELS.map(({ label, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setForm((p) => ({ ...p, level: value }))}
                    style={[spellStyles.levelChip, form.level === value && spellStyles.levelChipActive]}
                  >
                    <Text style={[spellStyles.levelChipText, form.level === value && spellStyles.levelChipTextActive]}>
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

              <View style={spellStyles.switchRow}>
                <Text style={spellStyles.switchLabel}>Requires Concentration</Text>
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

      <Modal visible={showSlotsModal} animationType="slide" transparent>
        <View style={spellStyles.modalOverlay}>
          <View style={spellStyles.modalCard}>
            <View style={spellStyles.modalHeader}>
              <Text style={spellStyles.modalTitle}>Configure Spell Slots</Text>
              <Pressable onPress={() => setShowSlotsModal(false)}>
                <MaterialIcons name="close" size={20} color={DnDColors.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((lvl) => (
                <View key={lvl} style={spellStyles.slotDraftRow}>
                  <Text style={spellStyles.slotDraftLabel}>Level {lvl}</Text>
                  <View style={spellStyles.slotDraftStepper}>
                    <Pressable
                      onPress={() => setSlotDraft((p) => ({ ...p, [lvl]: String(Math.max(0, (parseInt(p[lvl]) || 0) - 1)) }))}
                      style={spellStyles.stepBtn}
                    >
                      <Text style={spellStyles.stepBtnText}>−</Text>
                    </Pressable>
                    <TextInput
                      style={spellStyles.slotDraftInput}
                      value={slotDraft[lvl] ?? '0'}
                      onChangeText={(v) => setSlotDraft((p) => ({ ...p, [lvl]: v }))}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                    <Pressable
                      onPress={() => setSlotDraft((p) => ({ ...p, [lvl]: String((parseInt(p[lvl]) || 0) + 1) }))}
                      style={spellStyles.stepBtn}
                    >
                      <Text style={spellStyles.stepBtnText}>+</Text>
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
    </>
  );
}

const spellStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
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

// ─── Inventory Tab ────────────────────────────────────────────────────────────

function InventoryTab({ charId, token, character }: { charId: number; token: string; character: Character }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', item_type: 'other' as ItemType, weight: '0', quantity: '1',
    equipped: false, armor_class_bonus: '0',
    damage_dice: '', damage_type: '' as DamageType, damage_bonus: '0',
  });

  const load = useCallback(async () => {
    const data = await api.getInventory(token, charId);
    setItems(data);
    setLoading(false);
  }, [token, charId]);

  useEffect(() => { load(); }, [load]);

  const totalWeightNum = items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
  const totalWeight = totalWeightNum.toFixed(1);
  const carryCapacity = character.strength * 15;
  const weightPercent = carryCapacity > 0 ? Math.min(totalWeightNum / carryCapacity, 1) : 0;
  const weightColor = weightPercent > 0.9 ? DnDColors.danger : weightPercent > 0.66 ? '#E67E22' : DnDColors.success;

  const handleAddItem = async () => {
    if (!form.name.trim()) return;
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
    if (newQty === item.quantity) return;
    const updated = await api.updateItem(token, charId, item.id, { quantity: newQty });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleEquip = async (item: InventoryItem) => {
    const updated = await api.updateItem(token, charId, item.id, { equipped: !item.equipped });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert('Remove Item', `Remove ${item.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await api.deleteItem(token, charId, item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator color={DnDColors.accent} style={{ marginTop: 40 }} />;
  }

  const equipped = items.filter((i) => i.equipped);
  const stored = items.filter((i) => !i.equipped);

  return (
    <>
      <View style={invStyles.header}>
        <View style={invStyles.titleBlock}>
          <Text style={invStyles.title}>Inventory</Text>
          <Text style={invStyles.weight}>
            {totalWeight} / {carryCapacity} lbs
          </Text>
          <View style={invStyles.weightBarBg}>
            <View style={[invStyles.weightBarFill, { width: `${weightPercent * 100}%` as any, backgroundColor: weightColor }]} />
          </View>
        </View>
        <Pressable onPress={() => setShowModal(true)} style={invStyles.addBtn}>
          <MaterialIcons name="add" size={16} color="#fff" />
          <Text style={invStyles.addBtnText}>Add Item</Text>
        </Pressable>
      </View>

      {equipped.length > 0 && (
        <View style={invStyles.section}>
          <Text style={invStyles.sectionTitle}>Equipped Items</Text>
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

      <View style={invStyles.section}>
        <Text style={invStyles.sectionTitle}>Stored Items</Text>
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
          <Text style={invStyles.emptyText}>No items yet. Tap Add Item to get started.</Text>
        )}
      </View>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={invStyles.modalOverlay}>
          <View style={invStyles.modalCard}>
            <View style={invStyles.modalHeader}>
              <Text style={invStyles.modalTitle}>Add Item</Text>
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

            <Text style={invStyles.pickerLabel}>Type</Text>
            <View style={invStyles.typeRow}>
              {(['weapon', 'armor', 'shield', 'other'] as ItemType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setForm((p) => ({ ...p, item_type: t }))}
                  style={[invStyles.typeChip, form.item_type === t && invStyles.typeChipActive]}
                >
                  <Text style={[invStyles.typeChipText, form.item_type === t && invStyles.typeChipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={invStyles.row}>
              <View style={invStyles.half}>
                <InputField
                  label="Weight (lbs)"
                  value={form.weight}
                  onChangeText={(v) => setForm((p) => ({ ...p, weight: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={invStyles.half}>
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
                <View style={invStyles.row}>
                  <View style={invStyles.half}>
                    <InputField
                      label="Damage Dice"
                      value={form.damage_dice}
                      onChangeText={(v) => setForm((p) => ({ ...p, damage_dice: v }))}
                      placeholder="e.g. 1d8"
                    />
                  </View>
                  <View style={invStyles.half}>
                    <InputField
                      label="Magic Bonus"
                      value={form.damage_bonus}
                      onChangeText={(v) => setForm((p) => ({ ...p, damage_bonus: v }))}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                </View>

                <Text style={invStyles.pickerLabel}>Damage Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={invStyles.damageTypeScroll}>
                  {(['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning', 'poison', 'acid', 'thunder', 'necrotic', 'radiant', 'force', 'psychic'] as DamageType[]).map((dt) => (
                    <Pressable
                      key={dt}
                      onPress={() => setForm((p) => ({ ...p, damage_type: p.damage_type === dt ? '' : dt }))}
                      style={[invStyles.typeChip, form.damage_type === dt && invStyles.typeChipActive]}
                    >
                      <Text style={[invStyles.typeChipText, form.damage_type === dt && invStyles.typeChipTextActive]}>
                        {dt.charAt(0).toUpperCase() + dt.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={invStyles.switchRow}>
              <Text style={invStyles.switchLabel}>Equipped</Text>
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
    </>
  );
}

const invStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
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

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DnDColors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  sectionCard: {
    backgroundColor: DnDColors.surface, borderRadius: 12,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  sectionTitle: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border + '80',
  },
  infoLabel: { color: DnDColors.textMuted, fontSize: 13 },
  infoValueContainer: { flex: 1, alignItems: 'flex-end' },
  infoValue: { color: DnDColors.text, fontSize: 14, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statInputWrapper: { width: '30%' },
  savingThrowRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border + '80',
  },
  savingThrowName: { color: DnDColors.textMuted, fontSize: 13 },
  savingThrowMod: { color: DnDColors.accentLight, fontSize: 13, fontWeight: '600' },
  skillRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border + '60',
  },
  profBonusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: DnDColors.surface, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: 10,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  profBonusLabel: { color: DnDColors.textMuted, fontSize: 13 },
  profBonusValue: { color: DnDColors.accentLight, fontSize: 16, fontWeight: '700' },
  skillDot: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: DnDColors.textMuted, marginRight: 10,
  },
  skillDotFilled: {
    backgroundColor: DnDColors.accentLight,
    borderColor: DnDColors.accentLight,
  },
  skillName: { color: DnDColors.textMuted, fontSize: 13, flex: 1 },
  skillMod: { color: DnDColors.accentLight, fontSize: 13, fontWeight: '600' },
  skillModProficient: { color: DnDColors.success },
  hpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hpBtn: {
    backgroundColor: DnDColors.surfaceRaised, width: 36, height: 36,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  hpBtnText: { color: DnDColors.text, fontSize: 20, fontWeight: '600', lineHeight: 24 },
  hpCenter: { flex: 1, alignItems: 'center' },
  hpValue: { color: DnDColors.text, fontSize: 28, fontWeight: '700' },
  hpMax: { color: DnDColors.textMuted, fontSize: 20 },
  hpBarBg: {
    height: 6, width: '100%', backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 3, marginTop: 8, overflow: 'hidden',
  },
  hpBarFill: { height: '100%', borderRadius: 3 },
  hpBulkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
  },
  hpBulkInput: {
    flex: 1, backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 8, borderWidth: 1, borderColor: DnDColors.border,
    color: DnDColors.text, fontSize: 16, fontWeight: '600',
    textAlign: 'center', paddingVertical: 8,
  },
  hpActionBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center',
  },
  damageBtn: { backgroundColor: DnDColors.danger + 'CC' },
  healBtn: { backgroundColor: DnDColors.success + 'CC' },
  hpActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  combatStats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  combatStatBox: {
    flex: 1, backgroundColor: DnDColors.surface, borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: DnDColors.border,
  },
  combatStatValue: { color: DnDColors.text, fontSize: 22, fontWeight: '700' },
  combatStatLabel: { color: DnDColors.textMuted, fontSize: 11, marginTop: 4 },

  // Level Up modal
  luOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  luCard: {
    backgroundColor: DnDColors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '70%',
  },
  luHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  luTitle: { color: DnDColors.text, fontSize: 20, fontWeight: '800' },
  luClose: { padding: 4 },
  luLevelText: {
    color: DnDColors.accentLight, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8,
  },
  luInfoText: {
    color: DnDColors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 4,
  },
  luModeRow: {
    flexDirection: 'row', backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 10, padding: 3, marginTop: 16, marginBottom: 16,
  },
  luModeTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  luModeTabActive: { backgroundColor: DnDColors.accent },
  luModeText: { color: DnDColors.textMuted, fontSize: 13, fontWeight: '600' },
  luModeTextActive: { color: '#fff' },
  luRollSection: { alignItems: 'center', marginBottom: 16 },
  luRolledHp: {
    color: DnDColors.success, fontSize: 36, fontWeight: '800', marginBottom: 12,
  },
  luRollBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 8, borderWidth: 1, borderColor: DnDColors.accent,
  },
  luRollBtnText: { color: DnDColors.accentLight, fontSize: 15, fontWeight: '600' },
  luManualSection: { marginBottom: 16 },
  luManualLabel: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  luManualInput: {
    backgroundColor: DnDColors.surfaceRaised,
    borderWidth: 1, borderColor: DnDColors.border,
    borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14,
    color: DnDColors.text, fontSize: 18, fontWeight: '700', textAlign: 'center',
  },
  luConfirmBtn: { marginTop: 4 },
});
