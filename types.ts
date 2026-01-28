
export type CharacterType = 'Radical' | 'Kanji' | string;

export interface KanjiItem {
  id: string; // Internal unique ID
  level: number; // Column A
  type: CharacterType; // Column B
  order: number; // Column C
  character: string; // Column D
  meaning1: string; // Column F
  meaning2: string; // Column G
  components: string[]; // Column I (split)
  originalData: string[]; // Store full CSV row for export
}

export interface DragItem {
  id: string;
  type: 'character';
}
