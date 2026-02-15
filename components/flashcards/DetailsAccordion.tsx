import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { GrammarJsonValue } from '@/types/cards';

import { ChipsRow } from './ChipsRow';

type DetailsAccordionProps = {
  open: boolean;
  onToggle: () => void;
  grammar: Record<string, GrammarJsonValue>;
  collocations: string[];
  pitfalls: string | null;
  tags: string[];
};

const PREFERRED_GRAMMAR_KEYS = [
  'gender',
  'plural',
  'genitiv',
  'perfekt',
  'praeteritum',
  'konjunktiv2',
  'trennbar',
  'komparativ',
  'superlativ',
];

export const DetailsAccordion = memo(function DetailsAccordion({
  open,
  onToggle,
  grammar,
  collocations,
  pitfalls,
  tags,
}: DetailsAccordionProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = withAlpha(textColor, 0.1);
  const sectionTone = withAlpha(textColor, 0.045);
  const warningTone = withAlpha(textColor, 0.065);
  const warningBorder = withAlpha(textColor, 0.14);
  const grammarRows = useMemo(() => normalizeGrammarRows(grammar), [grammar]);

  const hasContent = grammarRows.length > 0 || collocations.length > 0 || Boolean(pitfalls) || tags.length > 0;
  if (!hasContent) {
    return null;
  }

  return (
    <View style={[styles.wrap, { borderColor }]}>
      <Pressable style={styles.header} onPress={onToggle} accessibilityRole="button">
        <Text style={[styles.headerText, { color: textColor }]}>Details</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={textColor} />
      </Pressable>

      {open ? (
        <View style={styles.content}>
          {grammarRows.length > 0 ? (
            <View style={[styles.section, { backgroundColor: sectionTone }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Grammar</Text>
              {grammarRows.map(({ key, value }) => (
                <View key={key} style={[styles.kvRow, { borderColor }]}>
                  <Text style={[styles.kvKey, { color: withAlpha(textColor, 0.75) }]}>{prettyKey(key)}</Text>
                  <Text style={[styles.kvValue, { color: textColor }]}>{formatGrammarValue(value)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {collocations.length > 0 ? (
            <View style={[styles.section, { backgroundColor: sectionTone }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Collocations</Text>
              {collocations.map((item) => (
                <Text key={item} style={[styles.listItem, { color: textColor }]}>
                  • {item}
                </Text>
              ))}
            </View>
          ) : null}

          {pitfalls ? (
            <View
              style={[
                styles.warningRow,
                {
                  backgroundColor: warningTone,
                  borderColor: warningBorder,
                },
              ]}>
              <Ionicons name="alert-circle-outline" size={16} color={textColor} />
              <Text style={[styles.warningText, { color: textColor }]}>Pitfall: {pitfalls}</Text>
            </View>
          ) : null}

          {tags.length > 0 ? (
            <View style={styles.tagsBlock}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Tags</Text>
              <ChipsRow chips={tags} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    gap: 11,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  section: {
    borderRadius: 14,
    padding: 12,
    gap: 7,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  kvKey: {
    fontSize: 13,
    flex: 1,
  },
  kvValue: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
  },
  warningRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  tagsBlock: {
    gap: 8,
  },
});

function normalizeGrammarRows(grammar: Record<string, GrammarJsonValue>) {
  const keys = Object.keys(grammar ?? {});
  const preferred = PREFERRED_GRAMMAR_KEYS.filter((key) => keys.includes(key));
  const remaining = keys.filter((key) => !preferred.includes(key)).sort((a, b) => a.localeCompare(b));
  const merged = [...preferred, ...remaining];
  return merged.map((key) => ({ key, value: grammar[key] }));
}

function prettyKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatGrammarValue(value: GrammarJsonValue): string {
  if (value === null) {
    return '-';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatGrammarValue).join(', ');
  }
  return Object.entries(value)
    .map(([k, v]) => `${prettyKey(k)}: ${formatGrammarValue(v)}`)
    .join(' | ');
}

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
