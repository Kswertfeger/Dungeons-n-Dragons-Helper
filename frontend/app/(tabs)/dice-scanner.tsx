import { DnDColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api } from '@/services/api';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLL_TYPES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'CUSTOM'] as const;
const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const;
const DICE_SIDES: Record<string, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

type ScanResult = { dice: number[]; total: number; count: number };

export default function DiceScannerScreen() {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [rollResult, setRollResult] = useState<{ base: number; mod: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [rollType, setRollType] = useState<string>('CUSTOM');
  const [diceType, setDiceType] = useState<string>('d20');
  const [numDice, setNumDice] = useState(1);
  const [modifier, setModifier] = useState(0);

  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permMessage}>Camera access is required to scan dice.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const scan = async () => {
    if (!cameraRef.current || loading) return;
    setLoading(true);
    setError(null);
    setScanResult(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
      if (!photo) throw new Error('Failed to capture photo');
      const data = await api.analyzeDice(photo.uri);
      if (data.error) throw new Error(data.error);
      setScanResult(data);
      // Save to roll history
      if (token) {
        api.saveRoll(token, {
          roll_type: rollType,
          dice_type: diceType,
          num_dice: data.count ?? 1,
          base_roll: data.total,
          modifier,
          total: data.total + modifier,
        }).catch(() => {});
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const rollDice = async () => {
    const sides = DICE_SIDES[diceType] ?? 20;
    const rolls = Array.from({ length: numDice }, () => Math.ceil(Math.random() * sides));
    const base = rolls.reduce((a, b) => a + b, 0);
    const total = base + modifier;
    setRollResult({ base, mod: modifier, total });
    setScanResult(null);
    setError(null);
    // Save to roll history
    if (token) {
      api.saveRoll(token, {
        roll_type: rollType, dice_type: diceType, num_dice: numDice,
        base_roll: base, modifier, total,
      }).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera view */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.aimBox} />

          {(scanResult || rollResult) && (
            <View style={styles.resultOverlay}>
              <Text style={styles.resultValue}>
                {scanResult ? scanResult.total : rollResult!.total}
              </Text>
              <Text style={styles.resultLabel}>Total Result</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.scanBtnWrapper}>
            <TouchableOpacity style={styles.scanBtn} onPress={scan} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.scanBtnText}>Scan Dice</Text>
              }
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>

      {/* Roll Configuration */}
      <ScrollView style={styles.configPanel} contentContainerStyle={styles.configContent}>
        <Text style={styles.panelTitle}>Roll Configuration</Text>

        <Text style={styles.configLabel}>Roll Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {ROLL_TYPES.map((rt) => (
            <Pressable
              key={rt}
              onPress={() => setRollType(rt)}
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

        <TouchableOpacity style={styles.rollBtn} onPress={rollDice}>
          <Text style={styles.rollBtnText}>Roll Dice</Text>
        </TouchableOpacity>

        {rollResult && (
          <View style={styles.resultCard}>
            <Text style={styles.resultCardLabel}>Base: {rollResult.base}  +  Mod: {rollResult.mod >= 0 ? `+${rollResult.mod}` : rollResult.mod}  =  Total: {rollResult.total}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DnDColors.background },
  cameraContainer: { height: SCREEN_HEIGHT * 0.42, width: '100%' },
  camera: { flex: 1, width: '100%' },
  aimBox: {
    position: 'absolute', top: '20%', left: '25%',
    width: '50%', height: '60%',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
  },
  resultOverlay: {
    position: 'absolute', top: 12, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16,
    paddingHorizontal: 28, paddingVertical: 12, alignItems: 'center',
  },
  resultValue: { fontSize: 52, fontWeight: '800', color: '#fff' },
  resultLabel: { fontSize: 14, color: '#ccc', marginTop: -4 },
  errorBox: {
    position: 'absolute', top: 12, alignSelf: 'center',
    backgroundColor: 'rgba(180,0,0,0.75)', borderRadius: 12,
    padding: 12, maxWidth: '80%',
  },
  errorText: { color: '#fff', textAlign: 'center', fontSize: 13 },
  scanBtnWrapper: { position: 'absolute', bottom: 16, width: '100%', alignItems: 'center' },
  scanBtn: {
    backgroundColor: DnDColors.accent, paddingHorizontal: 40,
    paddingVertical: 14, borderRadius: 28, minWidth: 120, alignItems: 'center',
  },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  configPanel: { flex: 1, backgroundColor: DnDColors.surface },
  configContent: { padding: 16, paddingBottom: 24 },
  panelTitle: {
    color: DnDColors.text, fontSize: 16, fontWeight: '700', marginBottom: 12,
  },
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
  permMessage: { color: DnDColors.text, fontSize: 16, textAlign: 'center', marginBottom: 24, paddingHorizontal: 32 },
  permBtn: {
    backgroundColor: DnDColors.accent, paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 28, alignItems: 'center',
  },
  permBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
