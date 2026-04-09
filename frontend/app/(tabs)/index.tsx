import { CharacterCard, CreateCharacterCard } from '@/components/character-card';
import { Toast } from '@/components/toast';
import { DnDColors } from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { api, type Character } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
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

export default function DashboardScreen() {
  const { token, username, logout } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const loadCharacters = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await api.getCharacters(token);
      setCharacters(data);
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadCharacters();
    }, [loadCharacters]),
  );

  const handleDelete = (character: Character) => {
    Alert.alert(
      'Delete Character',
      `Are you sure you want to delete ${character.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await api.deleteCharacter(token, character.id);
              setCharacters((prev) => prev.filter((c) => c.id !== character.id));
            } catch {
              setToast('Failed to delete character.');
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  // Build list data: characters + create card sentinel
  const listData: (Character | 'create')[] = [...characters, 'create'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Character Dashboard</Text>
          {username ? (
            <Text style={styles.subtitle}>Welcome back, {username}!</Text>
          ) : null}
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={18} color={DnDColors.textMuted} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={DnDColors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => (item === 'create' ? 'create' : String(item.id))}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            if (item === 'create') {
              return <CreateCharacterCard onPress={() => router.push('/create-character')} />;
            }
            return (
              <CharacterCard
                character={item}
                onPress={() => router.push(`/character/${item.id}`)}
                onDelete={() => handleDelete(item)}
              />
            );
          }}
        />
      )}

      <Toast message={toast} onHide={() => setToast(null)} />
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DnDColors.border,
  },
  title: {
    color: DnDColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: DnDColors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: DnDColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DnDColors.border,
  },
  logoutText: {
    color: DnDColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    padding: 10,
  },
  loader: {
    marginTop: 60,
  },
});
