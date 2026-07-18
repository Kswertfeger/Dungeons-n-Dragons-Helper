import { DiceScanModal, type ScanResult } from '@/components/dice-scan-modal';
import { RollHistoryItem } from '@/components/roll-history-item';
import { DnDColors } from '@/constants/colors';
import { useIsWide } from '@/hooks/use-breakpoint';
import { api, type Character, type RollHistory, type RollMode } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ROLL_TYPES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'CUSTOM'] as const;
const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;
const DICE_SIDES: Record<string, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};
const ROLL_TYPE_MODIFIER_KEY: Record<string, keyof Character | undefined> = {
  STR: 'strength_modifier', DEX: 'dexterity_modifier', CON: 'constitution_modifier',
  INT: 'intelligence_modifier', WIS: 'wisdom_modifier', CHA: 'charisma_modifier',
};
const ROLL_MODES: { mode: RollMode; label: string }[] = [
  { mode: 'normal', label: 'Normal' },
  { mode: 'advantage', label: 'Advantage' },
  { mode: 'disadvantage', label: 'Disadvantage' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  token: string;
  characterId: number;
  character: Character;
};

type RollResult = { base: number; mod: number; total: number; mode: RollMode; discarded: number | null };

export function DiceRollerModal({ visible, onClose, token, characterId, character }: Props) {
  const isWide = useIsWide();
  const [rollResult, setRollResult] = useState<RollResult | null>(null);
  const [recentRolls, setRecentRolls] = useState<RollHistory[]>([]);
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const [rollType, setRollType] = useState<string>('CUSTOM');
  const [diceType, setDiceType] = useState<string>('d20');
  const [numDice, setNumDice] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rollMode, setRollMode] = useState<RollMode>('normal');
  const [note, setNote] = useState('');

  const isCustom = rollType === 'CUSTOM';
  const effectiveNumDice = isCustom ? numDice : 1;

  const loadRecentRolls = useCallback(async () => {
    try {
      const data = await api.getRolls(token, characterId);
      setRecentRolls(data.slice(0, 5));
    } catch {
      // ignore
    }
  }, [token, characterId]);

  useEffect(() => {
    if (visible) {
      loadRecentRolls();
    } else {
      setRollResult(null);
    }
  }, [visible, loadRecentRolls]);

  const handleRollTypeSelect = (rt: string) => {
    const modKey = ROLL_TYPE_MODIFIER_KEY[rt];
    if (modKey) {
      setModifier(character[modKey] as number);
    } else if (rollType !== rt) {
      setModifier(0);
    }
    setRollType(rt);
  };

  const saveRoll = (data: Omit<RollHistory, 'id' | 'created_at'>) => {
    api.saveRoll(token, characterId, data)
      .then(() => loadRecentRolls())
      .catch(() => {});
  };

  const rollDiceSet = () => {
    const sides = DICE_SIDES[diceType] ?? 20;
    const rolls = Array.from({ length: effectiveNumDice }, () => Math.ceil(Math.random() * sides));
    return rolls.reduce((a, b) => a + b, 0);
  };

  const rollDice = () => {
    let base: number;
    let discarded: number | null = null;
    if (rollMode === 'normal') {
      base = rollDiceSet();
    } else {
      const a = rollDiceSet();
      const b = rollDiceSet();
      base = rollMode === 'advantage' ? Math.max(a, b) : Math.min(a, b);
      discarded = rollMode === 'advantage' ? Math.min(a, b) : Math.max(a, b);
    }
    const total = base + modifier;
    setRollResult({ base, mod: modifier, total, mode: rollMode, discarded });
    saveRoll({
      roll_type: rollType, dice_type: diceType, num_dice: effectiveNumDice,
      roll_mode: rollMode, discarded_roll: discarded,
      base_roll: base, modifier, total, note: note.trim(),
    });
  };

  const handleScanCaptured = (data: ScanResult) => {
    const total = data.total + modifier;
    setRollResult({ base: data.total, mod: modifier, total, mode: 'normal', discarded: null });
    saveRoll({
      roll_type: rollType,
      dice_type: diceType,
      num_dice: data.count ?? 1,
      roll_mode: 'normal',
      discarded_roll: null,
      base_roll: data.total,
      modifier,
      total,
      note: note.trim(),
    });
  };

  const handleViewMore = () => {
    onClose();
    router.push(`/character/${characterId}/roll-history`);
  };

  return (
    <Modal visible={visible} animationType={isWide ? 'fade' : 'slide'} transparent onRequestClose={onClose}>
      <View style={[styles.overlay, isWide && styles.overlayWide]}>
        <View style={[styles.sheet, isWide && styles.sheetWide]}>
          <View style={styles.header}>
            <Text style={styles.title}>Roll Dice</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={DnDColors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Pressable style={styles.scanCta} onPress={() => setScanModalVisible(true)}>
              <MaterialIcons name="camera-alt" size={18} color={DnDColors.accentLight} />
              <Text style={styles.scanCtaText}>Scan Dice with Camera</Text>
            </Pressable>

            <Text style={styles.configLabel}>Roll Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {ROLL_TYPES.map((rt) => (
                <Pressable
                  key={rt}
                  onPress={() => handleRollTypeSelect(rt)}
                  style={[styles.chip, rollType === rt && styles.chipActive]}
                >
                  <Text style={[styles.chipText, rollType === rt && styles.chipTextActive]}>{rt}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.configLabel}>Dice Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {DICE_TYPES.map((dt) => (
                <Pressable
                  key={dt}
                  onPress={() => setDiceType(dt)}
                  style={[styles.chip, diceType === dt && styles.chipActive]}
                >
                  <Text style={[styles.chipText, diceType === dt && styles.chipTextActive]}>{dt}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.configLabel}>Roll Mode</Text>
            <View style={styles.rollModeRow}>
              {ROLL_MODES.map(({ mode, label }) => (
                <Pressable
                  key={mode}
                  onPress={() => setRollMode(mode)}
                  style={[styles.rollModeChip, rollMode === mode && styles.chipActive]}
                >
                  <Text style={[styles.chipText, rollMode === mode && styles.chipTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            {isCustom ? (
              <View style={styles.stepperRow}>
                <View style={styles.stepperBlock}>
                  <Text style={styles.configLabel}>Number of Dice</Text>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => setNumDice((n) => Math.max(1, n - 1))} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.stepValue}>{numDice}</Text>
                    <Pressable onPress={() => setNumDice((n) => Math.min(10, n + 1))} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.stepperBlock}>
                  <Text style={styles.configLabel}>Modifier</Text>
                  <View style={styles.stepper}>
                    <Pressable onPress={() => setModifier((m) => Math.max(-10, m - 1))} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.stepValue}>{modifier >= 0 ? `+${modifier}` : `${modifier}`}</Text>
                    <Pressable onPress={() => setModifier((m) => Math.min(10, m + 1))} style={styles.stepBtn}>
                      <Text style={styles.stepBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.modifierInfoRow}>
                <Text style={styles.configLabel}>Modifier</Text>
                <Text style={styles.modifierInfoValue}>
                  {modifier >= 0 ? `+${modifier}` : `${modifier}`} (from {rollType})
                </Text>
              </View>
            )}

            <Text style={styles.configLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Sneak attack, Initiative..."
              placeholderTextColor={DnDColors.textDisabled}
              maxLength={100}
            />

            <TouchableOpacity style={styles.rollBtn} onPress={rollDice}>
              <Text style={styles.rollBtnText}>Roll Dice</Text>
            </TouchableOpacity>

            {rollResult && (
              <View style={styles.resultCard}>
                {rollResult.mode !== 'normal' && rollResult.discarded !== null && (
                  <Text style={[
                    styles.resultAdvDisText,
                    rollResult.mode === 'advantage' ? styles.advText : styles.disText,
                  ]}>
                    {rollResult.mode === 'advantage' ? 'Advantage' : 'Disadvantage'} — rolled{' '}
                    {Math.max(rollResult.base, rollResult.discarded)}, {Math.min(rollResult.base, rollResult.discarded)}
                    {' '}· kept {rollResult.base}
                  </Text>
                )}
                <Text style={styles.resultCardLabel}>Base: {rollResult.base}  +  Mod: {rollResult.mod >= 0 ? `+${rollResult.mod}` : rollResult.mod}  =  Total: {rollResult.total}</Text>
              </View>
            )}

            {recentRolls.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recent Rolls</Text>
                  <Pressable onPress={handleViewMore}>
                    <Text style={styles.viewMoreText}>View more</Text>
                  </Pressable>
                </View>
                {recentRolls.map((roll) => (
                  <RollHistoryItem key={roll.id} roll={roll} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <DiceScanModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        onCaptured={handleScanCaptured}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  overlayWide: { justifyContent: 'center', alignItems: 'center' },
  sheet: {
    backgroundColor: DnDColors.background,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '92%', paddingTop: 8,
  },
  sheetWide: {
    width: 520, maxWidth: '92%', maxHeight: '90%',
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  title: { color: DnDColors.text, fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  scanCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: DnDColors.surfaceRaised, borderRadius: 10,
    borderWidth: 1, borderColor: DnDColors.accentLight + '55',
    paddingVertical: 12, marginBottom: 4,
  },
  scanCtaText: { color: DnDColors.accentLight, fontSize: 14, fontWeight: '600' },
  configLabel: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 10,
  },
  chipRow: { marginBottom: 2 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: DnDColors.surfaceRaised, marginRight: 6,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  chipActive: { backgroundColor: DnDColors.accent, borderColor: DnDColors.accent },
  chipText: { color: DnDColors.textMuted, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  rollModeRow: { flexDirection: 'row', gap: 8 },
  rollModeChip: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8,
    backgroundColor: DnDColors.surfaceRaised,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  modifierInfoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  modifierInfoValue: { color: DnDColors.text, fontSize: 13, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  stepperBlock: { flex: 1 },
  stepper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: DnDColors.surfaceRaised, borderRadius: 8, padding: 6,
  },
  stepBtn: {
    backgroundColor: DnDColors.surface, width: 32, height: 32,
    borderRadius: 6, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { color: DnDColors.text, fontSize: 18, fontWeight: '600' },
  stepValue: { color: DnDColors.text, fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  noteInput: {
    backgroundColor: DnDColors.surfaceRaised,
    borderRadius: 8, borderWidth: 1, borderColor: DnDColors.border,
    color: DnDColors.text, fontSize: 14,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 4,
  },
  rollBtn: {
    backgroundColor: DnDColors.accent, borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginTop: 14,
  },
  rollBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resultCard: {
    backgroundColor: DnDColors.surfaceRaised, borderRadius: 8,
    padding: 12, marginTop: 10, alignItems: 'center',
  },
  resultCardLabel: { color: DnDColors.accentLight, fontSize: 14, fontWeight: '600' },
  resultAdvDisText: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  advText: { color: DnDColors.success },
  disText: { color: DnDColors.danger },
  recentSection: { marginTop: 20 },
  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  recentTitle: {
    color: DnDColors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  viewMoreText: { color: DnDColors.accentLight, fontSize: 13, fontWeight: '600' },
});
