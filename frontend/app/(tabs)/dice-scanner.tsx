import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Update this to your machine's local IP when testing on a physical device
const API_URL = 'http://10.0.0.189:8000/analyze/';

type ScanResult = { dice: number[]; total: number; count: number };

export default function DiceScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult]             = useState<ScanResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const cameraRef                       = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is required to scan dice.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scan = async () => {
    if (!cameraRef.current || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) throw new Error('Failed to capture photo');

      const form = new FormData();
      form.append('image', {
        uri:  photo.uri,
        name: 'dice.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${response.status}`);
      }

      setResult(await response.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        {/* Aim guide */}
        <View style={styles.aimBox} />

        {/* Result / error overlay */}
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.rollValue}>{result.total}</Text>
            <Text style={styles.rollLabel}>d6</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Scan button */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={scan} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Scan</Text>
            }
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  aimBox: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
  },
  resultBox: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rollValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#fff',
  },
  rollLabel: {
    fontSize: 20,
    color: '#ccc',
    marginTop: -8,
  },
  errorBox: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(180,0,0,0.75)',
    borderRadius: 12,
    padding: 16,
    maxWidth: '80%',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 32,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
});
