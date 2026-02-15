import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type ChipsRowProps = {
  chips: (string | null | undefined)[];
};

export const ChipsRow = memo(function ChipsRow({ chips }: ChipsRowProps) {
  const textColor = useThemeColor({}, 'text');
  const chipBackgroundColor = withAlpha(textColor, 0.06);
  const chipBorderColor = withAlpha(textColor, 0.14);
  const cleanedChips = chips.filter((chip): chip is string => Boolean(chip?.trim()));

  if (cleanedChips.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {cleanedChips.map((chip) => (
        <View
          key={chip}
          style={[
            styles.chip,
            {
              backgroundColor: chipBackgroundColor,
              borderColor: chipBorderColor,
            },
          ]}>
          <Text style={[styles.chipText, { color: textColor }]}>{chip}</Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'capitalize',
  },
});

function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((ch) => `${ch}${ch}`).join('') : hex;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(127,127,127,${alpha})`;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
