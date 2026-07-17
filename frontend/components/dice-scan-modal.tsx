import { DnDColors } from '@/constants/colors';
import { api } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type ScanResult = { dice: number[]; total: number; count: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptured: (data: ScanResult) => void;
};

export function DiceScanModal({ visible, onClose, onCaptured }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!visible) {
      setScanResult(null);
      setError(null);
    }
  }, [visible]);

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
      onCaptured(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan Dice</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={DnDColors.textMuted} />
            </Pressable>
          </View>

          {!permission ? null : !permission.granted ? (
            <View style={styles.permBox}>
              <Text style={styles.permMessage}>Camera access is required to scan dice.</Text>
              <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} ref={cameraRef}>
                <View style={styles.aimBox} />
                {scanResult && (
                  <View style={styles.resultOverlay}>
                    <Text style={styles.resultValue}>{scanResult.total}</Text>
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
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: DnDColors.background,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8, paddingBottom: 24,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  title: { color: DnDColors.text, fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 4 },
  permBox: { alignItems: 'center', paddingVertical: 40 },
  permMessage: { color: DnDColors.text, fontSize: 15, textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  permBtn: {
    backgroundColor: DnDColors.accent, paddingHorizontal: 28,
    paddingVertical: 12, borderRadius: 24, alignItems: 'center',
  },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cameraContainer: { height: 360, width: '100%', marginHorizontal: 0, paddingHorizontal: 16 },
  camera: { flex: 1, width: '100%', borderRadius: 12, overflow: 'hidden' },
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
  resultValue: { fontSize: 44, fontWeight: '800', color: '#fff' },
  resultLabel: { fontSize: 13, color: '#ccc', marginTop: -4 },
  errorBox: {
    position: 'absolute', top: 12, alignSelf: 'center',
    backgroundColor: 'rgba(180,0,0,0.75)', borderRadius: 12,
    padding: 12, maxWidth: '80%',
  },
  errorText: { color: '#fff', textAlign: 'center', fontSize: 13 },
  scanBtnWrapper: { position: 'absolute', bottom: 16, width: '100%', alignItems: 'center' },
  scanBtn: {
    backgroundColor: DnDColors.accent, paddingHorizontal: 32,
    paddingVertical: 11, borderRadius: 24, minWidth: 110, alignItems: 'center',
  },
  scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
