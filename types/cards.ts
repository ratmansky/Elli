export type CardPos = 'noun' | 'verb' | 'adj' | 'adv' | 'phrase' | 'other';

export type GrammarJsonValue =
  | string
  | number
  | boolean
  | null
  | GrammarJsonValue[]
  | { [key: string]: GrammarJsonValue };

export type CardRow = {
  id: string;
  term_display: string;
  lemma: string | null;
  pos: CardPos | null;
  cefr: string | null;
  difficulty: number | null;
  image_url: string | null;
  image_alt: string | null;
  audio_url: string | null;
  pronunciation_ipa: string | null;
  example_de: string | null;
  example_hint: string | null;
  collocations: string[];
  pitfalls: string | null;
  grammar: Record<string, GrammarJsonValue>;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
