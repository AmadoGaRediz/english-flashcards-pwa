export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adj'
  | 'adv'
  | 'pron'
  | 'prep'
  | 'conj'
  | 'det'
  | 'interj'
  | 'num';

export interface Word {
  id: number;
  en: string;
  es: string[];
  pos: PartOfSpeech;
  rank: number;
  example: string;
}
