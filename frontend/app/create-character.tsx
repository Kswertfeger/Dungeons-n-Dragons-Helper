import { InputField } from '@/components/input-field';
import { PrimaryButton } from '@/components/primary-button';
import { DnDColors } from '@/constants/colors';
import {
  ALIGNMENTS,
  BACKGROUNDS,
  CLASSES,
  RACES,
  STANDARD_ARRAY,
  STAT_KEYS,
  STAT_LABELS,
  type StatKey,
} from '@/constants/dnd-data';
import { useAuth } from '@/context/auth-context';
import { api } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useReducer, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Types ─────────────────────────────────────────────────────────────────────

type RolledStat = { dice: [number, number, number, number]; total: number } | null;

type WizardState = {
  step: number;
  race: string;
  character_class: string;
  background: string;
  abilityScoreMode: 'standard' | 'roll';
  standardAssignments: Record<StatKey, number | null>;
  rolledStats: Record<StatKey, RolledStat>;
  name: string;
  alignment: string;
  level: number;
  xp: number;
  hp_max: number;
  hpManual: boolean;
};

type WizardAction =
  | { type: 'SET_RACE'; race: string }
  | { type: 'SET_CLASS'; character_class: string }
  | { type: 'SET_BACKGROUND'; background: string }
  | { type: 'SET_ABILITY_MODE'; mode: 'standard' | 'roll' }
  | { type: 'ASSIGN_STANDARD'; stat: StatKey; value: number }
  | { type: 'ROLL_STAT'; stat: StatKey; rolled: NonNullable<RolledStat> }
  | { type: 'ROLL_ALL'; rolled: Record<StatKey, NonNullable<RolledStat>> }
  | { type: 'SET_NAME'; name: string }
  | { type: 'SET_ALIGNMENT'; alignment: string }
  | { type: 'SET_LEVEL'; level: number }
  | { type: 'SET_XP'; xp: number }
  | { type: 'SET_HP'; hp_max: number; manual: boolean }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' };

type StepProps = { state: WizardState; dispatch: React.Dispatch<WizardAction> };

// ── Constants ─────────────────────────────────────────────────────────────────

const NULL_ASSIGNMENTS: Record<StatKey, number | null> = {
  strength: null, dexterity: null, constitution: null,
  intelligence: null, wisdom: null, charisma: null,
};
const NULL_ROLLS: Record<StatKey, RolledStat> = {
  strength: null, dexterity: null, constitution: null,
  intelligence: null, wisdom: null, charisma: null,
};
const STEP_TITLES = ['Race', 'Class', 'Background', 'Ability Scores', 'Details', 'Review'];
const INITIAL_STATE: WizardState = {
  step: 0, race: '', character_class: '', background: '',
  abilityScoreMode: 'standard',
  standardAssignments: { ...NULL_ASSIGNMENTS },
  rolledStats: { ...NULL_ROLLS },
  name: '', alignment: '', level: 1, xp: 0, hp_max: 8, hpManual: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function roll4d6DropLowest(): NonNullable<RolledStat> {
  const dice: [number, number, number, number] = [
    Math.ceil(Math.random() * 6),
    Math.ceil(Math.random() * 6),
    Math.ceil(Math.random() * 6),
    Math.ceil(Math.random() * 6),
  ];
  const minVal = Math.min(...dice);
  return { dice, total: dice.reduce((s, d) => s + d, 0) - minVal };
}

function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatModifier(score: number): string {
  const m = getModifier(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

function getRaceBonus(state: WizardState, stat: StatKey): number {
  return RACES.find((r) => r.name === state.race)?.abilityBonuses[stat] ?? 0;
}

function getEffectiveScore(state: WizardState, stat: StatKey): number {
  const base = state.abilityScoreMode === 'standard'
    ? (state.standardAssignments[stat] ?? 10)
    : (state.rolledStats[stat]?.total ?? 10);
  return base + getRaceBonus(state, stat);
}

function suggestHp(state: WizardState): number {
  const hitDie = CLASSES.find((c) => c.name === state.character_class)?.hitDie ?? 8;
  return Math.max(1, hitDie + getModifier(getEffectiveScore(state, 'constitution')));
}

function isStepComplete(state: WizardState): boolean {
  switch (state.step) {
    case 0: return state.race !== '';
    case 1: return state.character_class !== '';
    case 2: return state.background !== '';
    case 3:
      return state.abilityScoreMode === 'standard'
        ? STAT_KEYS.every((s) => state.standardAssignments[s] !== null)
        : STAT_KEYS.every((s) => state.rolledStats[s] !== null);
    case 4: return state.name.trim() !== '';
    default: return true;
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function withHp(state: WizardState): WizardState {
  return state.hpManual ? state : { ...state, hp_max: suggestHp(state) };
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_RACE':
      return withHp({ ...state, race: action.race });
    case 'SET_CLASS':
      return withHp({ ...state, character_class: action.character_class });
    case 'SET_BACKGROUND':
      return { ...state, background: action.background };
    case 'SET_ABILITY_MODE':
      return { ...state, abilityScoreMode: action.mode };
    case 'ASSIGN_STANDARD': {
      const prev = state.standardAssignments[action.stat];
      const newVal = prev === action.value ? null : action.value;
      return withHp({ ...state, standardAssignments: { ...state.standardAssignments, [action.stat]: newVal } });
    }
    case 'ROLL_STAT':
      return withHp({ ...state, rolledStats: { ...state.rolledStats, [action.stat]: action.rolled } });
    case 'ROLL_ALL':
      return withHp({ ...state, rolledStats: action.rolled });
    case 'SET_NAME':
      return { ...state, name: action.name };
    case 'SET_ALIGNMENT':
      return { ...state, alignment: action.alignment };
    case 'SET_LEVEL':
      return { ...state, level: action.level };
    case 'SET_XP':
      return { ...state, xp: action.xp };
    case 'SET_HP':
      return { ...state, hp_max: action.hp_max, hpManual: action.manual };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(5, state.step + 1) };
    case 'PREV_STEP':
      return { ...state, step: Math.max(0, state.step - 1) };
    default:
      return state;
  }
}

// ── Shared Sub-Components ─────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
      ))}
    </View>
  );
}

type ChipItem = { name: string; badge?: string };

function ChipGrid({ items, selected, onSelect }: {
  items: ChipItem[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <View style={styles.chipGrid}>
      {items.map((item) => {
        const isSelected = selected === item.name;
        return (
          <Pressable
            key={item.name}
            onPress={() => onSelect(item.name)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {item.name}
            </Text>
            {item.badge ? (
              <Text style={[styles.chipBadge, isSelected && styles.chipBadgeSelected]}>
                {item.badge}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

// ── Step Components ────────────────────────────────────────────────────────────

function Step0Race({ state, dispatch }: StepProps) {
  const selectedRace = RACES.find((r) => r.name === state.race);
  return (
    <View>
      <Text style={styles.stepHint}>Choose your character's race</Text>
      <ChipGrid
        items={RACES.map((r) => ({ name: r.name }))}
        selected={state.race}
        onSelect={(name) => dispatch({ type: 'SET_RACE', race: name })}
      />
      {selectedRace && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionInfoTitle}>{selectedRace.name}</Text>
          <Text style={styles.selectionInfoText}>{selectedRace.description}</Text>
          {Object.keys(selectedRace.abilityBonuses).length > 0 && (
            <View style={styles.bonusRow}>
              {(Object.entries(selectedRace.abilityBonuses) as [StatKey, number][]).map(([stat, bonus]) => (
                <View key={stat} style={styles.bonusChip}>
                  <Text style={styles.bonusChipText}>{STAT_LABELS[stat]} +{bonus}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function Step1Class({ state, dispatch }: StepProps) {
  const selectedClass = CLASSES.find((c) => c.name === state.character_class);
  return (
    <View>
      <Text style={styles.stepHint}>Choose your character's class</Text>
      <ChipGrid
        items={CLASSES.map((c) => ({ name: c.name, badge: `d${c.hitDie}` }))}
        selected={state.character_class}
        onSelect={(name) => dispatch({ type: 'SET_CLASS', character_class: name })}
      />
      {selectedClass && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionInfoTitle}>{selectedClass.name}</Text>
          <Text style={styles.selectionInfoText}>
            Hit Die: d{selectedClass.hitDie}{'  ·  '}Primary: {selectedClass.primaryAbility}
          </Text>
          <Text style={styles.selectionInfoText}>
            Saving Throws: {selectedClass.savingThrows.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
}

function Step2Background({ state, dispatch }: StepProps) {
  const selectedBg = BACKGROUNDS.find((b) => b.name === state.background);
  return (
    <View>
      <Text style={styles.stepHint}>Choose your character's background</Text>
      <ChipGrid
        items={BACKGROUNDS.map((b) => ({ name: b.name }))}
        selected={state.background}
        onSelect={(name) => dispatch({ type: 'SET_BACKGROUND', background: name })}
      />
      {selectedBg && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionInfoTitle}>{selectedBg.name}</Text>
          <Text style={styles.selectionInfoText}>
            Skill Proficiencies: {selectedBg.skillProficiencies.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
}

function StandardArrayPanel({ state, dispatch }: StepProps) {
  const usedElsewhere = new Set<number>();
  STAT_KEYS.forEach((s) => {
    if (state.standardAssignments[s] !== null) usedElsewhere.add(state.standardAssignments[s]!);
  });

  return (
    <View>
      <Text style={styles.arrayHint}>Tap a number to assign it. Each value can only be used once.</Text>
      {STAT_KEYS.map((stat) => {
        const assigned = state.standardAssignments[stat];
        const raceBonus = getRaceBonus(state, stat);
        const effectiveScore = assigned !== null ? assigned + raceBonus : null;
        const modText = effectiveScore !== null ? formatModifier(effectiveScore) : '—';
        return (
          <View key={stat} style={styles.statAssignRow}>
            <Text style={styles.statAssignLabel}>{STAT_LABELS[stat]}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.statValueScroll}
              contentContainerStyle={styles.statValuePicker}
            >
              {STANDARD_ARRAY.map((value) => {
                const isAssignedHere = assigned === value;
                const isUsedByOther = !isAssignedHere && usedElsewhere.has(value);
                return (
                  <Pressable
                    key={value}
                    disabled={isUsedByOther}
                    onPress={() => dispatch({ type: 'ASSIGN_STANDARD', stat, value })}
                    style={[
                      styles.arrayValueChip,
                      isAssignedHere && styles.arrayValueChipSelected,
                      isUsedByOther && styles.arrayValueChipDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.arrayValueText,
                      isAssignedHere && styles.arrayValueTextSelected,
                      isUsedByOther && styles.arrayValueTextDisabled,
                    ]}>
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.statModPreview}>
              {raceBonus > 0 && assigned !== null && (
                <Text style={styles.statRaceBonus}>+{raceBonus}</Text>
              )}
              <Text style={styles.statModText}>{modText}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function RollPanel({ state, dispatch }: StepProps) {
  const handleRollAll = () => {
    const rolled = {} as Record<StatKey, NonNullable<RolledStat>>;
    STAT_KEYS.forEach((stat) => { rolled[stat] = roll4d6DropLowest(); });
    dispatch({ type: 'ROLL_ALL', rolled });
  };

  return (
    <View>
      <Pressable onPress={handleRollAll} style={styles.rollAllBtn}>
        <MaterialIcons name="casino" size={15} color="#fff" />
        <Text style={styles.rollAllText}>Roll All Stats</Text>
      </Pressable>
      {STAT_KEYS.map((stat) => {
        const rolled = state.rolledStats[stat];
        const raceBonus = getRaceBonus(state, stat);
        const effectiveScore = rolled ? rolled.total + raceBonus : null;
        const modText = effectiveScore !== null ? formatModifier(effectiveScore) : '—';
        const dropIndex = rolled ? rolled.dice.indexOf(Math.min(...rolled.dice)) : -1;
        return (
          <View key={stat} style={styles.statRollRow}>
            <Text style={styles.statAssignLabel}>{STAT_LABELS[stat]}</Text>
            {rolled ? (
              <View style={styles.diceRow}>
                {rolled.dice.map((d, i) => (
                  <View key={i} style={[styles.dieBox, i === dropIndex && styles.dieBoxDropped]}>
                    <Text style={[styles.dieText, i === dropIndex && styles.dieTextDropped]}>{d}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.diceRowPlaceholder}>
                <Text style={styles.unrolledText}>not rolled</Text>
              </View>
            )}
            <Text style={styles.rollTotal}>{rolled ? `= ${rolled.total}` : ''}</Text>
            <View style={styles.statModPreview}>
              {raceBonus > 0 && rolled !== null && (
                <Text style={styles.statRaceBonus}>+{raceBonus}</Text>
              )}
              <Text style={styles.statModText}>{modText}</Text>
            </View>
            <Pressable
              onPress={() => dispatch({ type: 'ROLL_STAT', stat, rolled: roll4d6DropLowest() })}
              style={styles.rerollBtn}
            >
              <MaterialIcons name="refresh" size={14} color={DnDColors.textMuted} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function Step3AbilityScores({ state, dispatch }: StepProps) {
  return (
    <View>
      <Text style={styles.stepHint}>Set your ability scores</Text>
      <View style={styles.modeTabRow}>
        <Pressable
          onPress={() => dispatch({ type: 'SET_ABILITY_MODE', mode: 'standard' })}
          style={[styles.modeTab, state.abilityScoreMode === 'standard' && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, state.abilityScoreMode === 'standard' && styles.modeTabTextActive]}>
            Standard Array
          </Text>
        </Pressable>
        <Pressable
          onPress={() => dispatch({ type: 'SET_ABILITY_MODE', mode: 'roll' })}
          style={[styles.modeTab, state.abilityScoreMode === 'roll' && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, state.abilityScoreMode === 'roll' && styles.modeTabTextActive]}>
            Roll Stats
          </Text>
        </Pressable>
      </View>
      {state.abilityScoreMode === 'standard'
        ? <StandardArrayPanel state={state} dispatch={dispatch} />
        : <RollPanel state={state} dispatch={dispatch} />}
    </View>
  );
}

function Step4Details({ state, dispatch }: StepProps) {
  const cls = CLASSES.find((c) => c.name === state.character_class);
  const conScore = getEffectiveScore(state, 'constitution');
  const hpHint = cls ? `Based on d${cls.hitDie} + CON (${formatModifier(conScore)}) = ${suggestHp(state)}` : '';

  return (
    <View>
      <InputField
        label="Character Name *"
        value={state.name}
        onChangeText={(v) => dispatch({ type: 'SET_NAME', name: v })}
        placeholder="Enter character name"
        autoCapitalize="words"
      />

      <Text style={styles.sectionLabel}>Alignment</Text>
      <View style={styles.chipGrid}>
        {ALIGNMENTS.map((a) => {
          const isSelected = state.alignment === a;
          return (
            <Pressable
              key={a}
              onPress={() => dispatch({ type: 'SET_ALIGNMENT', alignment: a })}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{a}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Starting Level</Text>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => dispatch({ type: 'SET_LEVEL', level: Math.max(1, state.level - 1) })}
          style={styles.stepBtn}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{state.level}</Text>
        <Pressable
          onPress={() => dispatch({ type: 'SET_LEVEL', level: Math.min(20, state.level + 1) })}
          style={styles.stepBtn}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Starting XP</Text>
      <TextInput
        style={styles.numInput}
        value={String(state.xp)}
        onChangeText={(v) => dispatch({ type: 'SET_XP', xp: parseInt(v) || 0 })}
        keyboardType="numeric"
        placeholderTextColor={DnDColors.textDisabled}
        placeholder="0"
      />

      <Text style={styles.sectionLabel}>Max HP</Text>
      <TextInput
        style={styles.numInput}
        value={String(state.hp_max)}
        onChangeText={(v) => dispatch({ type: 'SET_HP', hp_max: Math.max(1, parseInt(v) || 1), manual: true })}
        keyboardType="numeric"
        placeholderTextColor={DnDColors.textDisabled}
      />
      {!state.hpManual && hpHint ? <Text style={styles.hpHint}>{hpHint}</Text> : null}
    </View>
  );
}

function Step5Review({ state }: { state: WizardState }) {
  const cls = CLASSES.find((c) => c.name === state.character_class);
  return (
    <View>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewName}>{state.name || '(unnamed)'}</Text>
        <Text style={styles.reviewSubtitle}>
          Level {state.level} {state.race} {state.character_class}
        </Text>
        <View style={styles.reviewDivider} />
        <ReviewRow label="Background" value={state.background} />
        <ReviewRow label="Alignment" value={state.alignment || '—'} />
        <ReviewRow label="Starting XP" value={String(state.xp)} />
        <ReviewRow label="Max HP" value={String(state.hp_max)} />
        {cls ? <ReviewRow label="Hit Die" value={`d${cls.hitDie}`} /> : null}
        <View style={styles.reviewDivider} />
        <Text style={styles.reviewSectionLabel}>Ability Scores</Text>
        <View style={styles.statsGrid}>
          {STAT_KEYS.map((stat) => {
            const score = getEffectiveScore(state, stat);
            return (
              <View key={stat} style={styles.reviewStatBlock}>
                <Text style={styles.reviewStatName}>{STAT_LABELS[stat]}</Text>
                <Text style={styles.reviewStatValue}>{score}</Text>
                <Text style={styles.reviewStatMod}>{formatModifier(score)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CreateCharacterScreen() {
  const { token } = useAuth();
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed = isStepComplete(state);
  const isFirst = state.step === 0;
  const isLast = state.step === 5;

  const handleCreate = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await api.createCharacter(token, {
        name: state.name.trim(),
        race: state.race,
        character_class: state.character_class,
        background: state.background,
        alignment: state.alignment,
        level: state.level,
        xp: state.xp,
        hp_max: state.hp_max,
        hp_current: state.hp_max,
        strength: getEffectiveScore(state, 'strength'),
        dexterity: getEffectiveScore(state, 'dexterity'),
        constitution: getEffectiveScore(state, 'constitution'),
        intelligence: getEffectiveScore(state, 'intelligence'),
        wisdom: getEffectiveScore(state, 'wisdom'),
        charisma: getEffectiveScore(state, 'charisma'),
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create character.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 0: return <Step0Race state={state} dispatch={dispatch} />;
      case 1: return <Step1Class state={state} dispatch={dispatch} />;
      case 2: return <Step2Background state={state} dispatch={dispatch} />;
      case 3: return <Step3AbilityScores state={state} dispatch={dispatch} />;
      case 4: return <Step4Details state={state} dispatch={dispatch} />;
      case 5: return <Step5Review state={state} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={isFirst ? () => router.back() : () => dispatch({ type: 'PREV_STEP' })}
          style={styles.headerBtn}
        >
          <MaterialIcons name={isFirst ? 'close' : 'arrow-back'} size={22} color={DnDColors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ProgressDots step={state.step} />
          <Text style={styles.stepTitle}>{STEP_TITLES[state.step]}</Text>
        </View>
        <Text style={styles.stepCount}>{state.step + 1} / 6</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {renderStep()}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          {!isFirst && (
            <PrimaryButton
              variant="outline"
              label="Back"
              onPress={() => dispatch({ type: 'PREV_STEP' })}
              style={styles.footerBtn}
            />
          )}
          <PrimaryButton
            label={isLast ? 'Create Character' : 'Next'}
            onPress={isLast ? handleCreate : () => dispatch({ type: 'NEXT_STEP' })}
            loading={isLast && loading}
            disabled={!canProceed}
            style={styles.footerBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DnDColors.background },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border,
  },
  headerBtn: { padding: 4, width: 40 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  stepTitle: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  stepCount: { color: DnDColors.textDisabled, fontSize: 12, width: 40, textAlign: 'right' },

  // Progress dots
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DnDColors.border },
  dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: DnDColors.accent },

  // Content
  content: { padding: 16, paddingBottom: 8 },
  stepHint: { color: DnDColors.textMuted, fontSize: 14, marginBottom: 16, lineHeight: 20 },

  // Chip grid (races, classes, backgrounds, alignment)
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: DnDColors.surface,
    borderWidth: 1, borderColor: DnDColors.border, alignItems: 'center',
  },
  chipSelected: { backgroundColor: DnDColors.accent, borderColor: DnDColors.accent },
  chipText: { color: DnDColors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  chipBadge: { color: DnDColors.textDisabled, fontSize: 10, marginTop: 2 },
  chipBadgeSelected: { color: 'rgba(255,255,255,0.7)' },

  // Selection info card
  selectionInfo: {
    backgroundColor: DnDColors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: DnDColors.border,
    padding: 14, marginBottom: 8,
  },
  selectionInfoTitle: { color: DnDColors.accentLight, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  selectionInfoText: { color: DnDColors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 2 },
  bonusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  bonusChip: {
    backgroundColor: DnDColors.success + '22', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: DnDColors.success + '66',
  },
  bonusChipText: { color: DnDColors.success, fontSize: 12, fontWeight: '700' },

  // Mode toggle (segmented control)
  modeTabRow: {
    flexDirection: 'row', backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 10, padding: 3, marginBottom: 16,
  },
  modeTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  modeTabActive: { backgroundColor: DnDColors.accent },
  modeTabText: { color: DnDColors.textMuted, fontSize: 13, fontWeight: '600' },
  modeTabTextActive: { color: '#fff' },

  // Standard array
  arrayHint: { color: DnDColors.textDisabled, fontSize: 12, marginBottom: 12 },
  statAssignRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statAssignLabel: { color: DnDColors.textMuted, fontSize: 12, fontWeight: '700', width: 36 },
  statValueScroll: { flex: 1 },
  statValuePicker: { flexDirection: 'row', gap: 6, paddingRight: 4 },
  arrayValueChip: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: DnDColors.surfaceRaised,
    borderWidth: 1, borderColor: DnDColors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  arrayValueChipSelected: { backgroundColor: DnDColors.accent, borderColor: DnDColors.accent },
  arrayValueChipDisabled: { opacity: 0.3 },
  arrayValueText: { color: DnDColors.textMuted, fontSize: 13, fontWeight: '700' },
  arrayValueTextSelected: { color: '#fff' },
  arrayValueTextDisabled: { color: DnDColors.textDisabled },
  statModPreview: { width: 52, alignItems: 'flex-end' },
  statRaceBonus: { color: DnDColors.success, fontSize: 10, fontWeight: '700' },
  statModText: { color: DnDColors.text, fontSize: 13, fontWeight: '600' },

  // Roll panel
  rollAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: DnDColors.accent, borderRadius: 8,
    paddingVertical: 12, marginBottom: 16,
  },
  rollAllText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statRollRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 4 },
  diceRow: { flexDirection: 'row', gap: 4 },
  diceRowPlaceholder: { width: 124, alignItems: 'flex-start', justifyContent: 'center' },
  dieBox: {
    width: 28, height: 28, borderRadius: 5,
    backgroundColor: DnDColors.surfaceRaised,
    borderWidth: 1, borderColor: DnDColors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dieBoxDropped: { borderColor: DnDColors.danger + '80', backgroundColor: DnDColors.danger + '11' },
  dieText: { color: DnDColors.text, fontSize: 12, fontWeight: '700' },
  dieTextDropped: { color: DnDColors.danger, textDecorationLine: 'line-through' },
  rollTotal: { color: DnDColors.text, fontSize: 13, fontWeight: '700', width: 36, textAlign: 'right' },
  unrolledText: { color: DnDColors.textDisabled, fontSize: 11 },
  rerollBtn: { width: 28, alignItems: 'center' },

  // Step 4 details
  sectionLabel: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8, marginTop: 4,
  },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DnDColors.surfaceRaised, borderRadius: 8,
    padding: 8, marginBottom: 12, alignSelf: 'flex-start',
  },
  stepBtn: {
    backgroundColor: DnDColors.surface, width: 36, height: 36,
    borderRadius: 6, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: DnDColors.border,
  },
  stepBtnText: { color: DnDColors.text, fontSize: 20, fontWeight: '600' },
  stepperValue: { color: DnDColors.text, fontSize: 18, fontWeight: '700', minWidth: 32, textAlign: 'center' },
  numInput: {
    backgroundColor: DnDColors.surface,
    borderWidth: 1, borderColor: DnDColors.border,
    borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14,
    color: DnDColors.text, fontSize: 15, marginBottom: 4,
  },
  hpHint: { color: DnDColors.textDisabled, fontSize: 12, marginBottom: 12 },

  // Review
  reviewCard: {
    backgroundColor: DnDColors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: DnDColors.border, padding: 16,
  },
  reviewName: { color: DnDColors.text, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  reviewSubtitle: { color: DnDColors.accentLight, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  reviewDivider: { height: 1, backgroundColor: DnDColors.border, marginVertical: 12 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewLabel: { color: DnDColors.textMuted, fontSize: 13 },
  reviewValue: { color: DnDColors.text, fontSize: 13, fontWeight: '600' },
  reviewSectionLabel: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  reviewStatBlock: { width: '33.33%', alignItems: 'center', paddingVertical: 8 },
  reviewStatName: { color: DnDColors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  reviewStatValue: { color: DnDColors.text, fontSize: 20, fontWeight: '800' },
  reviewStatMod: { color: DnDColors.accentLight, fontSize: 12, fontWeight: '600' },

  // Footer
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: DnDColors.border,
    backgroundColor: DnDColors.background,
  },
  footerBtn: { flex: 1 },

  // Error
  error: { color: DnDColors.danger, fontSize: 13, textAlign: 'center', marginTop: 12 },
});
