
import { DailyLog, PrayerId, PrayerRecord, UserSettings, PrayerStatus } from '../types';
import { getDateKeyInTimeZone, getFormattedDateKey } from './dateUtils';

const STORAGE_KEY_LOGS = 'deen_tracker_logs';
const STORAGE_KEY_SETTINGS = 'deen_tracker_settings';
const DEFAULT_LOG_TIME_ZONE = 'Asia/Dhaka';

// Default Settings
const defaultSettings: UserSettings = {
  location: 'Dhaka, Bangladesh',
  district: 'dhaka', // Default to Dhaka
  calculationMethod: 'Islamic Foundation Bangladesh',
  madhhab: 'hanafi',
  useMoonSighting: false,
  moonSightingOffset: 0,
};

export const getSettings = (): UserSettings => {
  const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
  const settings = data ? JSON.parse(data) : defaultSettings;
  // Migration: Ensure district exists for old users
  if (!settings.district) settings.district = 'dhaka';
  return settings;
};

export const saveSettings = (settings: UserSettings) => {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
};

export const getDailyLog = (date: Date, mode: string, timeZone: string = DEFAULT_LOG_TIME_ZONE): DailyLog => {
  const dateKey = getDateKeyInTimeZone(date, timeZone);
  const legacyDateKey = getFormattedDateKey(date);
  const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '{}');

  const existingLog = allLogs[dateKey] || (legacyDateKey !== dateKey ? allLogs[legacyDateKey] : null);
  if (existingLog) {
    const log = { ...existingLog, date: dateKey } as DailyLog;
    if (!log.amols) {
        log.amols = { surahWakiah: false, surahMulk: false, surahBaqarahLast2: false, threeQuls: false };
    }
    // Backward compatibility check for new field
    if (log.amols.surahWakiah === undefined) {
        log.amols.surahWakiah = false;
    }
    if (typeof log.quranAyahs !== 'number') {
        log.quranAyahs = 0;
    }

    // One-time migration from legacy local-date key to timezone-based key.
    if (!allLogs[dateKey]) {
      allLogs[dateKey] = log;
      if (legacyDateKey !== dateKey) {
        delete allLogs[legacyDateKey];
      }
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(allLogs));
    }
    return log;
  }

  // Create new log based on mode
  const newLog: DailyLog = {
    date: dateKey,
    prayers: generatePrayerList(mode),
    quranAyahs: 0,
    amols: {
      surahWakiah: false,
      surahMulk: false,
      surahBaqarahLast2: false,
      threeQuls: false,
    }
  };
  
  return newLog;
};

export const saveDailyLog = (log: DailyLog) => {
  const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '{}');
  allLogs[log.date] = log;
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(allLogs));
};

// Retrieve last N days of logs for AI Analysis
export const getRecentLogs = (days: number): DailyLog[] => {
  const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '{}');
  const sortedKeys = Object.keys(allLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Get last N keys, reverse to have chronological order (oldest to newest) for analysis
  const recentKeys = sortedKeys.slice(0, days).reverse();
  
  return recentKeys.map(key => allLogs[key]);
};

// --- DATA MANAGEMENT (Backup/Restore) ---

export const createBackup = (): string => {
  const backup = {
    version: 1,
    generatedAt: new Date().toISOString(),
    logs: JSON.parse(localStorage.getItem(STORAGE_KEY_LOGS) || '{}'),
    settings: JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || JSON.stringify(defaultSettings)),
  };
  return JSON.stringify(backup, null, 2);
};

export const restoreBackup = (jsonString: string): boolean => {
  try {
    const backup = JSON.parse(jsonString);
    
    // Basic validation
    if (!backup.logs || typeof backup.logs !== 'object') {
      throw new Error('Invalid backup format: missing logs');
    }

    // Restore Data
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(backup.logs));
    
    if (backup.settings) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(backup.settings));
    }

    return true;
  } catch (error) {
    console.error("Restore failed:", error);
    return false;
  }
};

// Helper to generate list based on rules
const generatePrayerList = (mode: string): PrayerRecord[] => {
  const basePrayers: PrayerRecord[] = [
    { id: PrayerId.FAJR, label: 'ফজর', isFarz: true, status: 'none' },
    mode === 'শুক্রবার' 
      ? { id: PrayerId.JUMUAH, label: 'জুম্মা', isFarz: true, status: 'none' }
      : { id: PrayerId.DHUHR, label: 'জুহর', isFarz: true, status: 'none' },
    { id: PrayerId.ASR, label: 'আসর', isFarz: true, status: 'none' },
    { id: PrayerId.MAGHRIB, label: 'মাগরিব', isFarz: true, status: 'none' },
    { id: PrayerId.ISHA, label: 'ঈশা', isFarz: true, status: 'none' },
    { id: PrayerId.TAHAJJUD, label: 'তাহাজ্জুদ', isFarz: false, status: 'none' },
  ];

  if (mode === 'ঈদ') {
    basePrayers.splice(1, 0, { 
      id: PrayerId.EID, 
      label: 'ঈদের নামাজ', 
      isFarz: true, 
      isEid: true,
      status: 'none' 
    });
  }

  return basePrayers;
};
