import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../theme';
import { adminTheme } from '../adminTheme';

interface CategoryTab {
  id: string;
  label: string;
}

interface CategoryTabsProps {
  categories: CategoryTab[];
  selectedId: string;
  onSelect: (id: string) => void;
  tone?: 'light' | 'dark';
  style?: ViewStyle;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedId,
  onSelect,
  tone = 'light',
  style,
}) => {
  const colors = tone === 'dark' ? adminTheme.colors : theme.colors;
  const radius = tone === 'dark' ? adminTheme.radius : theme.radius;
  const spacing = tone === 'dark' ? adminTheme.spacing : theme.spacing;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.container, style]}>
      {categories.map((category) => {
        const isActive = category.id === selectedId;
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tab,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                marginRight: spacing.sm,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
              },
              isActive && {
                backgroundColor: colors.text,
                borderColor: colors.text,
              },
            ]}
            onPress={() => onSelect(category.id)}
          >
            <AppText
              variant="caption"
              style={[
                styles.label,
                { color: colors.textSecondary },
                isActive && { color: colors.background },
              ] as unknown as TextStyle}
            >
              {category.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  tab: {},
  label: {},
});
