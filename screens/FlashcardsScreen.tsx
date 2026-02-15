import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CardViewer } from '@/components/flashcards/CardViewer';
import { useCards } from '@/hooks/use-cards';
import { useThemeColor } from '@/hooks/use-theme-color';

export function FlashcardsScreen() {
  const { cards, isLoading, error, retry } = useCards();
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const mutedText = withAlpha(textColor, 0.75);
  const buttonBorder = withAlpha(textColor, 0.2);
  const screenTone = withAlpha(tintColor, 0.03);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: screenTone || backgroundColor }]}>
        <ActivityIndicator size="small" color={textColor} />
        <Text style={[styles.statusText, { color: mutedText }]}>Loading flashcards…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: screenTone || backgroundColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Couldn&apos;t load cards</Text>
        <Text style={[styles.statusText, { color: mutedText }]}>{error}</Text>
        <Pressable style={[styles.retryButton, { borderColor: buttonBorder }]} onPress={retry}>
          <Text style={[styles.retryText, { color: textColor }]}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: screenTone || backgroundColor }]}>
        <Text style={[styles.title, { color: textColor }]}>No published cards yet</Text>
        <Text style={[styles.statusText, { color: mutedText }]}>
          Add a few rows to `cards` and set `is_published = true`.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: screenTone || backgroundColor }]}>
      <CardViewer cards={cards} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryText: {
    fontWeight: '700',
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
