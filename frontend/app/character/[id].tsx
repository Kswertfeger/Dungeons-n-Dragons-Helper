import { InputField } from '@/components/input-field';
import { PrimaryButton } from '@/components/primary-button';
import { StatBlock } from '@/components/stat-block';
import { TabSwitcher } from '@/components/tab-switcher';
import { Toast } from '@/components/toast';
import { DnDColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api, type Character } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STAT_TABS = ['Stats', 'Skills & Proficiencies', 'Combat'];

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

  const setField = (key: keyof Character) => (val: string) =>
    setEditForm((prev) => ({ ...prev, [key]: val }));

  const setNumField = (key: keyof Character) => (val: string) =>
    setEditForm((prev) => ({ ...prev, [key]: parseInt(val) || 0 }));

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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color={DnDColors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.charName}>{character.name}</Text>
          <Text style={styles.charMeta}>
            Level {character.level} · {character.race} {character.character_class}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {editing ? (
            <PrimaryButton label="Save" onPress={handleSave} loading={saving} style={styles.editBtn} />
          ) : (
            <Pressable onPress={() => setEditing(true)} style={styles.editBtnOutline}>
              <MaterialIcons name="edit" size={14} color={DnDColors.accentLight} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Sub-nav links to spells/inventory */}
      <View style={styles.subNav}>
        <Pressable
          onPress={() => router.push(`/character/${id}/spells`)}
          style={styles.subNavBtn}
        >
          <MaterialIcons name="auto-fix-high" size={14} color={DnDColors.textMuted} />
          <Text style={styles.subNavText}>Spells</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/character/${id}/inventory`)}
          style={styles.subNavBtn}
        >
          <MaterialIcons name="inventory" size={14} color={DnDColors.textMuted} />
          <Text style={styles.subNavText}>Inventory</Text>
        </Pressable>
      </View>

      <TabSwitcher tabs={STAT_TABS} activeIndex={activeTab} onChange={setActiveTab} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {activeTab === 0 && (
          <StatsTab character={character} editing={editing} editForm={editForm} setField={setField} setNumField={setNumField} />
        )}
        {activeTab === 1 && <SkillsTab character={character} mod={mod} />}
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
      </ScrollView>

      <Toast message={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
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

function SkillsTab({ character, mod }: { character: Character; mod: (v: number) => string }) {
  return (
    <SectionCard title="Skills">
      {SKILLS.map((skill) => {
        const val = character[skill.stat] as number;
        const label = val >= 0 ? `+${val}` : `${val}`;
        return (
          <View key={skill.name} style={styles.skillRow}>
            <View style={styles.skillDot} />
            <Text style={styles.skillName}>{skill.name}</Text>
            <Text style={styles.skillMod}>{label}</Text>
          </View>
        );
      })}
    </SectionCard>
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

  const hpPercent = character.hp_max > 0 ? character.hp_current / character.hp_max : 0;
  const hpColor = hpPercent > 0.5 ? DnDColors.success : hpPercent > 0.25 ? DnDColors.warning : DnDColors.danger;

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
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  charName: { color: DnDColors.text, fontSize: 18, fontWeight: '700' },
  charMeta: { color: DnDColors.textMuted, fontSize: 12, marginTop: 1 },
  headerActions: { minWidth: 70, alignItems: 'flex-end' },
  editBtn: { paddingVertical: 6, paddingHorizontal: 14 },
  editBtnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 6, borderWidth: 1, borderColor: DnDColors.accentLight,
  },
  editBtnText: { color: DnDColors.accentLight, fontSize: 13, fontWeight: '600' },
  subNav: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border,
  },
  subNavBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: 10,
    backgroundColor: DnDColors.surface, borderRadius: 6,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  subNavText: { color: DnDColors.textMuted, fontSize: 12, fontWeight: '600' },
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
  skillDot: {
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1, borderColor: DnDColors.textMuted, marginRight: 10,
  },
  skillName: { color: DnDColors.textMuted, fontSize: 13, flex: 1 },
  skillMod: { color: DnDColors.accentLight, fontSize: 13, fontWeight: '600' },
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
  combatStats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  combatStatBox: {
    flex: 1, backgroundColor: DnDColors.surface, borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: DnDColors.border,
  },
  combatStatValue: { color: DnDColors.text, fontSize: 22, fontWeight: '700' },
  combatStatLabel: { color: DnDColors.textMuted, fontSize: 11, marginTop: 4 },
});
