import { InputField } from '@/components/input-field';
import { PrimaryButton } from '@/components/primary-button';
import { DnDColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STATS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
const STAT_LABELS: Record<string, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

export default function CreateCharacterScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    race: '',
    character_class: '',
    level: '1',
    hp_max: '10',
    background: '',
    alignment: '',
    xp: '0',
    strength: '10',
    dexterity: '10',
    constitution: '10',
    intelligence: '10',
    wisdom: '10',
    charisma: '10',
  });

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    if (!form.name.trim() || !form.race.trim() || !form.character_class.trim()) {
      setError('Name, Race, and Class are required.');
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await api.createCharacter(token, {
        name: form.name.trim(),
        race: form.race.trim(),
        character_class: form.character_class.trim(),
        level: parseInt(form.level) || 1,
        hp_max: parseInt(form.hp_max) || 10,
        hp_current: parseInt(form.hp_max) || 10,
        background: form.background.trim(),
        alignment: form.alignment.trim(),
        xp: parseInt(form.xp) || 0,
        strength: parseInt(form.strength) || 10,
        dexterity: parseInt(form.dexterity) || 10,
        constitution: parseInt(form.constitution) || 10,
        intelligence: parseInt(form.intelligence) || 10,
        wisdom: parseInt(form.wisdom) || 10,
        charisma: parseInt(form.charisma) || 10,
      });
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create character.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={DnDColors.text} />
          </Pressable>
          <Text style={styles.title}>Create Character</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <InputField label="Character Name *" value={form.name} onChangeText={set('name')} placeholder="Enter character name" />
          <InputField label="Race *" value={form.race} onChangeText={set('race')} placeholder="e.g. Dwarf, Elf, Human" />
          <InputField label="Class *" value={form.character_class} onChangeText={set('character_class')} placeholder="e.g. Fighter, Wizard, Rogue" />
          <InputField label="Background" value={form.background} onChangeText={set('background')} placeholder="e.g. Soldier, Sage" />
          <InputField label="Alignment" value={form.alignment} onChangeText={set('alignment')} placeholder="e.g. Neutral Good" />

          <View style={styles.row}>
            <View style={styles.half}>
              <InputField label="Level" value={form.level} onChangeText={set('level')} keyboardType="numeric" placeholder="1" />
            </View>
            <View style={styles.half}>
              <InputField label="Max HP" value={form.hp_max} onChangeText={set('hp_max')} keyboardType="numeric" placeholder="10" />
            </View>
          </View>
          <InputField label="Starting XP" value={form.xp} onChangeText={set('xp')} keyboardType="numeric" placeholder="0" />

          <Text style={styles.sectionTitle}>Ability Scores</Text>
          <View style={styles.statsGrid}>
            {STATS.map((stat) => (
              <View key={stat} style={styles.statInput}>
                <InputField
                  label={STAT_LABELS[stat]}
                  value={form[stat]}
                  onChangeText={set(stat)}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Create Character"
            onPress={handleCreate}
            loading={loading}
            style={styles.createBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DnDColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DnDColors.border,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    color: DnDColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: DnDColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  statInput: {
    width: '33.33%',
    paddingRight: 8,
  },
  error: {
    color: DnDColors.danger,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  createBtn: {
    marginTop: 8,
  },
});
