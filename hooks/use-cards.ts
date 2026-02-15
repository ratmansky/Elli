import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { CardRow } from '@/types/cards';

const MAX_FETCH_RETRIES = 1;
const RETRY_DELAY_MS = 800;

type UseCardsState = {
  cards: CardRow[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
};

export function useCards(): UseCardsState {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const retry = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isActive = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function runFetch(attempt = 0) {
      if (!isActive) {
        return;
      }

      if (attempt === 0) {
        setIsLoading(true);
        setError(null);
      }

      const { data, error: fetchError } = await supabase
        .from('cards')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!isActive) {
        return;
      }

      if (fetchError) {
        if (attempt < MAX_FETCH_RETRIES) {
          retryTimer = setTimeout(() => {
            void runFetch(attempt + 1);
          }, RETRY_DELAY_MS);
          return;
        }

        setError(fetchError.message ?? 'Unable to load cards.');
        setCards([]);
        setIsLoading(false);
        return;
      }

      setCards(((data as Record<string, unknown>[] | null) ?? []).map(normalizeCardRow));
      setError(null);
      setIsLoading(false);
    }

    void runFetch();

    return () => {
      isActive = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [refreshKey]);

  return useMemo(
    () => ({
      cards,
      isLoading,
      error,
      retry,
    }),
    [cards, isLoading, error, retry]
  );
}

function normalizeCardRow(row: Record<string, unknown>): CardRow {
  return {
    id: getString(row.id) ?? `card-${Math.random().toString(36).slice(2)}`,
    term_display:
      getString(row.term_display) ??
      getString(row.term) ??
      getString(row.word) ??
      getString(row.front) ??
      getString(row.front_text) ??
      'Untitled card',
    lemma: getString(row.lemma),
    pos: (getString(row.pos) as CardRow['pos']) ?? null,
    cefr: getString(row.cefr),
    difficulty: getNumber(row.difficulty),
    image_url: normalizeImageUrl(getString(row.image_url) ?? getString(row.image)),
    image_alt: getString(row.image_alt) ?? getString(row.image_caption),
    audio_url: getString(row.audio_url),
    pronunciation_ipa: getString(row.pronunciation_ipa),
    example_de: getString(row.example_de) ?? getString(row.example) ?? getString(row.sentence_de),
    example_hint: getString(row.example_hint) ?? getString(row.hint),
    collocations: getStringArray(row.collocations),
    pitfalls: getString(row.pitfalls),
    grammar: isRecord(row.grammar)
      ? (row.grammar as CardRow['grammar'])
      : isRecord(row.grammar_json)
        ? (row.grammar_json as CardRow['grammar'])
        : {},
    tags: getStringArray(row.tags),
    is_published: typeof row.is_published === 'boolean' ? row.is_published : true,
    created_at: getString(row.created_at) ?? new Date().toISOString(),
    updated_at: getString(row.updated_at) ?? new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function normalizeImageUrl(rawUrl: string | null): string | null {
  if (!rawUrl) {
    return null;
  }

  const safeUrl = rawUrl.startsWith('http://') ? rawUrl.replace('http://', 'https://') : rawUrl;

  try {
    const parsed = new URL(safeUrl);

    if (parsed.hostname === 'images.unsplash.com') {
      return safeUrl;
    }

    if (parsed.hostname.endsWith('unsplash.com') && parsed.pathname.startsWith('/photos/')) {
      const slug = parsed.pathname.split('/').filter(Boolean)[1];
      if (!slug) {
        return safeUrl;
      }
      const id = slug.includes('-') ? (slug.split('-').pop() ?? slug) : slug;
      return `https://unsplash.com/photos/${id}/download?force=true&w=1200`;
    }

    return safeUrl;
  } catch {
    return safeUrl;
  }
}
