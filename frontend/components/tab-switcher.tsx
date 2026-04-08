import { DnDColors } from '@/constants/colors';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  scrollable?: boolean;
};

export function TabSwitcher({ tabs, activeIndex, onChange, scrollable = false }: Props) {
  const content = tabs.map((tab, i) => (
    <Pressable key={tab} onPress={() => onChange(i)} style={styles.tab}>
      <Text style={[styles.tabText, i === activeIndex && styles.activeText]}>{tab}</Text>
      {i === activeIndex && <View style={styles.indicator} />}
    </Pressable>
  ));

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.row}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={[styles.row, styles.container]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: DnDColors.border,
  },
  scrollContainer: {
    borderBottomWidth: 1,
    borderBottomColor: DnDColors.border,
  },
  row: {
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    color: DnDColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  activeText: {
    color: DnDColors.accentLight,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: DnDColors.accentLight,
    borderRadius: 1,
  },
});
