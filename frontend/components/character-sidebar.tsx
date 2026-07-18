import { DnDColors } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';
import { type Character } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type Section = 'overview' | 'spells' | 'inventory';

type NavItem = { key: Section; label: string; icon: keyof typeof MaterialIcons.glyphMap };

const NAV_ITEMS: NavItem[] = [
  { key: 'overview', label: 'Overview', icon: 'dashboard' },
  { key: 'spells', label: 'Spells', icon: 'auto-fix-high' },
  { key: 'inventory', label: 'Inventory', icon: 'inventory' },
];

type Props = {
  character: Character;
  activeSection: Section | null;
  onSelectSection: (section: Section) => void;
  onSwitchCharacter: () => void;
};

export function CharacterSidebar({ character, activeSection, onSelectSection, onSwitchCharacter }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onSwitchCharacter}
        style={styles.switchBtn}
        accessibilityRole="button"
      >
        <View style={styles.switchIconWrap}>
          <MaterialIcons name="swap-horiz" size={18} color={DnDColors.accentLight} />
        </View>
        <View style={styles.switchTextWrap}>
          <Text style={styles.charName} numberOfLines={1}>{character.name}</Text>
          <Text style={styles.switchLabel}>Switch Character</Text>
        </View>
      </Pressable>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelectSection(item.key)}
              style={[styles.navItem, isActive && styles.navItemActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <MaterialIcons
                name={item.icon}
                size={18}
                color={isActive ? DnDColors.accentLight : DnDColors.textMuted}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: LAYOUT.sidebarWidth,
    backgroundColor: DnDColors.tabBackground,
    borderRightWidth: 1,
    borderRightColor: DnDColors.border,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: DnDColors.surface,
    borderWidth: 1,
    borderColor: DnDColors.border,
  },
  switchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DnDColors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTextWrap: { flex: 1 },
  charName: { color: DnDColors.text, fontSize: 14, fontWeight: '700' },
  switchLabel: { color: DnDColors.accentLight, fontSize: 11, fontWeight: '600', marginTop: 1 },
  nav: { gap: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: DnDColors.surfaceRaised,
  },
  navText: { color: DnDColors.textMuted, fontSize: 14, fontWeight: '600' },
  navTextActive: { color: DnDColors.accentLight },
});
