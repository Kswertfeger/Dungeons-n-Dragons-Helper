import { RollHistoryItem } from '@/components/roll-history-item';
import { DnDColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api, type RollHistory } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RollHistoryScreen() {
  const { token } = useAuth();
  const [rolls, setRolls] = useState<RollHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getRolls(token);
      setRolls(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const handleClear = () => {
    Alert.alert(
      'Clear Roll History',
      'Are you sure you want to delete all roll history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            await api.clearRolls(token);
            setRolls([]);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Roll History</Text>
        {rolls.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={DnDColors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={rolls}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <RollHistoryItem roll={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No rolls yet. Head to the Dice tab to start rolling!</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DnDColors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border,
  },
  title: { color: DnDColors.text, fontSize: 22, fontWeight: '800' },
  clearBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: DnDColors.danger + '22',
    borderRadius: 8, borderWidth: 1, borderColor: DnDColors.danger,
  },
  clearBtnText: { color: DnDColors.danger, fontSize: 13, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  emptyText: {
    color: DnDColors.textMuted, textAlign: 'center',
    marginTop: 60, paddingHorizontal: 32, lineHeight: 22,
  },
});
