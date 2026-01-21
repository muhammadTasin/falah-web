
export type PrayerStatus = 'done' | 'missed' | 'none';

export enum PrayerId {
  FAJR = 'fajr',
  DHUHR = 'dhuhr',
  JUMUAH = 'jumuah',
  ASR = 'asr',
  MAGHRIB = 'maghrib',
  ISHA = 'isha',
  TAHAJJUD = 'tahajjud',
  EID = 'eid',
}

export interface PrayerRecord {
  id: PrayerId;
  label: string;
  isFarz: boolean;
  isEid?: boolean;
  status: PrayerStatus;
  completedAt?: number;
  note?: string;
}

export interface AmolRecord {
  surahWakiah: boolean;
  surahMulk: boolean;
  surahBaqarahLast2: boolean;
  threeQuls: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  prayers: PrayerRecord[];
  quranAyahs: number;
  amols: AmolRecord;
}

export enum DayMode {
  NORMAL = 'সাধারণ দিন',
  FRIDAY = 'শুক্রবার',
  EID = 'ঈদ',
}

export interface UserSettings {
  location: string;
  district: string; // New field for BD District ID
  calculationMethod: string;
  madhhab: 'hanafi' | 'shafi';
  useMoonSighting: boolean;
  moonSightingOffset: number; // days to adjust
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}
