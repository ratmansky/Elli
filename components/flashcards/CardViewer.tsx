import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { CardRow } from '@/types/cards';

import { CardImage } from './CardImage';
import { ChipsRow } from './ChipsRow';
import { DetailsAccordion } from './DetailsAccordion';

type CardViewerProps = {
  cards: CardRow[];
};

export const CardViewer = memo(function CardViewer({ cards }: CardViewerProps) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const flipValue = useRef(new Animated.Value(0)).current;

  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = withAlpha(textColor, 0.11);
  const mutedText = withAlpha(textColor, 0.66);
  const surfaceColor = withAlpha(textColor, 0.03);
  const secondaryButtonColor = withAlpha(textColor, 0.028);

  const { width } = useWindowDimensions();
  const isCompact = width < 370;
  const cardWidth = Math.min(800, width - 28);
  const cardHeight = Math.min(400, Math.max(220, cardWidth / 2));

  const card = cards[index];
  const displayTerm = card?.term_display?.trim() || card?.lemma?.trim() || 'Untitled card';

  useEffect(() => {
    setRevealed(false);
    setShowHint(false);
    setDetailsOpen(false);
    flipValue.setValue(0);
  }, [index, flipValue]);

  useEffect(() => {
    Animated.timing(flipValue, {
      toValue: revealed ? 180 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [flipValue, revealed]);

  const frontRotateY = flipValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotateY = flipValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 14 && Math.abs(gestureState.dy) < 12,
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -42) {
            setIndex((prev) => Math.min(prev + 1, cards.length - 1));
          } else if (gestureState.dx >= 42) {
            setIndex((prev) => Math.max(prev - 1, 0));
          }
        },
      }),
    [cards.length]
  );

  if (!card) {
    return null;
  }

  return (
    <View style={styles.root}>
      <View style={styles.progressRow}>
        <View style={[styles.progressPill, { backgroundColor: withAlpha(textColor, 0.06) }]}>
          <Text style={[styles.progressText, { color: mutedText }]}>
            {index + 1} / {cards.length}
          </Text>
        </View>
      </View>

      <View style={styles.stage} {...panResponder.panHandlers}>
        <View style={[styles.cardFrame, { width: cardWidth, height: cardHeight }]}> 
          <Animated.View
            style={[
              styles.cardFace,
              {
                borderColor,
                backgroundColor: surfaceColor,
                transform: [{ perspective: 1200 }, { rotateY: frontRotateY }],
              },
            ]}
            pointerEvents={revealed ? 'none' : 'auto'}>
            <Pressable onPress={() => setRevealed(true)} style={styles.frontFace}>
              <CardImage imageUrl={card.image_url} imageAlt={card.image_alt} aspectRatio={2} />
              <View style={[styles.tapHint, { borderColor, backgroundColor: withAlpha(textColor, 0.07) }]}>
                <Text style={[styles.tapHintText, { color: textColor }]}>Tap to reveal</Text>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View
            style={[
              styles.cardFace,
              {
                borderColor,
                backgroundColor: surfaceColor,
                transform: [{ perspective: 1200 }, { rotateY: backRotateY }],
              },
            ]}
            pointerEvents={revealed ? 'auto' : 'none'}>
            <View style={styles.backTopRow}>
              <Pressable
                onPress={() => setRevealed(false)}
                style={[styles.backButton, { borderColor, backgroundColor: withAlpha(textColor, 0.03) }]}>
                <Text style={[styles.backButtonText, { color: textColor }]}>Show front</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.backScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.termBlock}>
                <Text style={[styles.termText, { color: textColor }]}>{displayTerm}</Text>
                {card.pronunciation_ipa || card.lemma || card.audio_url ? (
                  <View style={styles.metaRow}>
                    {card.pronunciation_ipa ? (
                      <Text style={[styles.ipaText, { color: mutedText }]}>/{card.pronunciation_ipa}/</Text>
                    ) : null}
                    {card.lemma ? (
                      <Text style={[styles.lemmaText, { color: mutedText }]}>Lemma: {card.lemma}</Text>
                    ) : null}
                    {card.audio_url ? (
                      <Pressable
                        onPress={() => {
                          void Linking.openURL(card.audio_url as string);
                        }}
                        style={[
                          styles.audioButton,
                          {
                            borderColor,
                            backgroundColor: withAlpha(textColor, 0.03),
                          },
                        ]}>
                        <Text style={[styles.audioButtonText, { color: textColor }]}>Play audio</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                <ChipsRow
                  chips={[
                    card.pos ?? null,
                    card.cefr ?? null,
                    card.difficulty ? `Difficulty ${card.difficulty}` : null,
                  ]}
                />
              </View>

              {card.example_de ? (
                <View style={[styles.exampleBlock, { borderColor, backgroundColor }]}> 
                  <Text style={[styles.exampleLabel, { color: mutedText }]}>Example</Text>
                  <Text style={[styles.exampleText, { color: textColor }]}>{card.example_de}</Text>

                  {card.example_hint ? (
                    <View style={styles.hintWrap}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setShowHint((prev) => !prev)}
                        style={[
                          styles.hintButton,
                          {
                            borderColor,
                            backgroundColor: withAlpha(textColor, 0.03),
                          },
                        ]}>
                        <Text style={[styles.hintButtonText, { color: textColor }]}>
                          {showHint ? 'Hide hint' : 'Show hint'}
                        </Text>
                      </Pressable>
                      {showHint ? (
                        <Text style={[styles.hintText, { color: mutedText }]}>{card.example_hint}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={[styles.exampleBlock, { borderColor, backgroundColor }]}> 
                  <Text style={[styles.exampleLabel, { color: mutedText }]}>Example</Text>
                  <Text style={[styles.hintText, { color: mutedText }]}>No example sentence yet.</Text>
                </View>
              )}

              <DetailsAccordion
                open={detailsOpen}
                onToggle={() => setDetailsOpen((prev) => !prev)}
                grammar={card.grammar}
                collocations={card.collocations}
                pitfalls={card.pitfalls}
                tags={card.tags}
              />
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      <View style={[styles.navRow, isCompact && styles.navRowCompact]}>
        <Pressable
          onPress={() => setIndex((prev) => Math.max(prev - 1, 0))}
          disabled={index === 0}
          style={[
            styles.navButton,
            {
              borderColor,
              backgroundColor: secondaryButtonColor,
              opacity: index === 0 ? 0.45 : 1,
            },
          ]}>
          <Text style={[styles.navButtonText, { color: textColor }]}>Prev</Text>
        </Pressable>
        <Pressable
          onPress={() => setIndex((prev) => Math.min(prev + 1, cards.length - 1))}
          disabled={index === cards.length - 1}
          style={[
            styles.navButton,
            {
              borderColor: withAlpha(tintColor, 0.4),
              backgroundColor: withAlpha(tintColor, 0.13),
              opacity: index === cards.length - 1 ? 0.45 : 1,
            },
          ]}>
          <Text style={[styles.navButtonText, { color: textColor }]}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  progressRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
  },
  progressPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cardFrame: {
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderRadius: 22,
    padding: 12,
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    overflow: 'hidden',
  },
  frontFace: {
    flex: 1,
    gap: 10,
  },
  tapHint: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '700',
  },
  backTopRow: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  backScrollContent: {
    gap: 10,
    paddingBottom: 10,
  },
  termBlock: {
    gap: 8,
  },
  metaRow: {
    gap: 6,
  },
  termText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  ipaText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  lemmaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  audioButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  audioButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exampleBlock: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 11,
    gap: 7,
  },
  exampleLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  exampleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  hintWrap: {
    marginTop: 2,
    gap: 6,
  },
  hintButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  hintButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  navRowCompact: {
    gap: 8,
  },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 15,
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
