import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type CardImageProps = {
  imageUrl: string | null;
  imageAlt: string | null;
  aspectRatio?: number;
};

export const CardImage = memo(function CardImage({ imageUrl, imageAlt, aspectRatio = 4 / 3 }: CardImageProps) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const panelColor = useThemeColor({}, 'background');
  const borderColor = withAlpha(textColor, 0.1);

  if (!imageUrl || hasLoadError) {
    return (
      <View style={[styles.base, styles.placeholder, { aspectRatio, backgroundColor: panelColor, borderColor }]}>
        <View style={[styles.glow, { backgroundColor: withAlpha(textColor, 0.06) }]} />
        <View style={[styles.glowSecondary, { backgroundColor: withAlpha(textColor, 0.04) }]} />
        <View style={[styles.iconWrap, { borderColor }]}>
          <Ionicons name="image-outline" size={28} color={withAlpha(textColor, 0.6)} />
        </View>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      accessibilityLabel={imageAlt ?? 'Flashcard image'}
      contentFit="cover"
      transition={150}
      style={[styles.base, { aspectRatio, borderColor }]}
      cachePolicy="memory-disk"
      onError={() => setHasLoadError(true)}
    />
  );
});

const styles = StyleSheet.create({
  base: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -60,
    right: -30,
  },
  glowSecondary: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    bottom: -45,
    left: -35,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
