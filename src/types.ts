export type EntryType = 'text' | 'image';

export interface IEntry {
  uid: number;
  parentUid?: number;
  type: EntryType;
  imageUrl?: string;
  key: string[];
  keysecondary?: string[];
  content: string;
  comment: string;
  scan_depth?: number;
  selective?: boolean;
  enabled?: boolean;
  disable?: boolean;
}
