import { RollHistoryItem } from '@/components/roll-history-item';
import { DnDColors, RollTypeBadgeColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api, type RollHistory } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FILTERS = ['All', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'CUSTOM'] as const;
type Filter = typeof FILTERS[number];

export default function RollHistoryScreen() {
  const { token } = useAuth();
  const [rolls, setRolls] = useState<RollHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

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

  const filtered = useMemo(
    () => activeFilter === 'All' ? rolls : rolls.filter((r) => r.roll_type === activeFilter),
    [rolls, activeFilter],
  );

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const avg = filtered.reduce((s, r) => s + r.total, 0) / filtered.length;
    const highest = Math.max(...filtered.map((r) => r.total));
    return { count: filtered.length, avg: avg.toFixed(1), highest };
  }, [filtered]);

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

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            const badgeColor = f === 'All' ? DnDColors.accent : RollTypeBadgeColors[f];
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[
                  styles.filterChip,
                  isActive && { backgroundColor: badgeColor, borderColor: badgeColor },
                ]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
      {loading ? (
        <ActivityIndicator color={DnDColors.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            stats ? (
              <View style={styles.statsCard}>
                <StatBox label="Rolls" value={String(stats.count)} />
                <View style={styles.statDivider} />
                <StatBox label="Average" value={stats.avg} />
                <View style={styles.statDivider} />
                <StatBox label="Highest" value={String(stats.highest)} highlight />
              </View>
            ) : null
          }
          renderItem={({ item }) => <RollHistoryItem roll={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {activeFilter === 'All'
                ? 'No rolls yet. Head to the Dice tab to start rolling!'
                : `No ${activeFilter} rolls yet.`}
            </Text>
          }
        />
      )}
      </View>
    </SafeAreaView>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  filterRow: {
    height: 48,
    borderBottomWidth: 1, borderBottomColor: DnDColors.border,
    justifyContent: 'center',
  },
  listContainer: { flex: 1 },
  filterContent: { paddingHorizontal: 16, alignItems: 'center', gap: 8, flexGrow: 1 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14,
    backgroundColor: DnDColors.surface,
    borderWidth: 1, borderColor: DnDColors.border,
  },
  filterChipText: { color: DnDColors.textMuted, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DnDColors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: DnDColors.border,
    padding: 16, marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: DnDColors.text, fontSize: 22, fontWeight: '800' as const },
  statValueHighlight: { color: DnDColors.accentLight },
  statLabel: { color: DnDColors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: DnDColors.border },
  emptyText: {
    color: DnDColors.textMuted, textAlign: 'center',
    marginTop: 60, paddingHorizontal: 32, lineHeight: 22,
  },
});
