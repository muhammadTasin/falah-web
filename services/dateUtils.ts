
import { DayMode, HijriDate, UserSettings } from '../types';

const DEFAULT_TIME_ZONE = 'Asia/Dhaka';

export const getFormattedDate = (date: Date, timeZone: string = DEFAULT_TIME_ZONE): string => {
  return new Intl.DateTimeFormat('bn-BD', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const getTimeZoneDateParts = (timeZone: string, date: Date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const year = Number(parts.find(p => p.type === 'year')?.value ?? date.getFullYear());
  const month = Number(parts.find(p => p.type === 'month')?.value ?? date.getMonth() + 1);
  const day = Number(parts.find(p => p.type === 'day')?.value ?? date.getDate());
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? date.getHours());
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? date.getMinutes());
  const second = Number(parts.find(p => p.type === 'second')?.value ?? date.getSeconds());
  return { year, month, day, hour, minute, second };
};

const getTimeZoneOffsetMinutes = (timeZone: string, date: Date = new Date()): number => {
  const { year, month, day, hour, minute, second } = getTimeZoneDateParts(timeZone, date);
  const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((asUTC - date.getTime()) / 60000);
};

export const getDateKeyInTimeZone = (date: Date, timeZone: string): string => {
  const { year, month, day } = getTimeZoneDateParts(timeZone, date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const formatTimeNow = (
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
  includeSeconds: boolean = true
): string => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  if (includeSeconds) {
    options.second = '2-digit';
  }
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const formatTimeFromHHmm = (timeStr: string, timeZone: string = DEFAULT_TIME_ZONE): string => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const { year, month, day } = getTimeZoneDateParts(timeZone);
  const offsetMinutes = getTimeZoneOffsetMinutes(timeZone);
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes, 0) - offsetMinutes * 60000;
  return formatTimeNow(new Date(utcMs), timeZone, false);
};

// CRITICAL FIX: Use local date components instead of ISOString (UTC)
// This prevents data from 'vanishing' when the time is late/early in the day relative to UTC.
export const getFormattedDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Simple Hijri detection using Intl API
export const getHijriDate = (date: Date, offset: number = 0, timeZone: string = DEFAULT_TIME_ZONE): HijriDate => {
  // Adjust date by offset days
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + offset);

  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    timeZone,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  
  const parts = formatter.formatToParts(adjustedDate);
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '1445', 10);
  
  // Map month index to name
  const monthNames = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];

  return {
    day,
    month,
    year,
    monthName: monthNames[month - 1] || ''
  };
};

export const detectDayMode = (date: Date, settings: UserSettings, timeZone: string = DEFAULT_TIME_ZONE): DayMode => {
  const hijri = getHijriDate(date, settings.moonSightingOffset, timeZone);
  
  // Eid ul-Fitr: 1st Shawwal (Month 10)
  const isEidFitr = hijri.month === 10 && hijri.day === 1;
  
  // Eid ul-Adha: 10th Dhu al-Hijjah (Month 12)
  const isEidAdha = hijri.month === 12 && hijri.day === 10;

  if (isEidFitr || isEidAdha) {
    return DayMode.EID;
  }

  const weekDay = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  if (weekDay === 'Fri') {
    return DayMode.FRIDAY;
  }

  return DayMode.NORMAL;
};

// Returns a display label for the day based on Islamic Events priority
export const getIslamicEventLabel = (mode: DayMode, hijri: HijriDate): string => {
  if (mode === DayMode.EID) return 'আজ: পবিত্র ঈদ';

  // 1. Muharram (1) 10: Ashura
  if (hijri.month === 1 && hijri.day === 10) return 'আজ: পবিত্র আশুরা';
  
  // 2. Rajab (7) 27: Shab-e-Meraj
  if (hijri.month === 7 && hijri.day === 27) return 'আজ: শবে মেরাজ';
  
  // 3. Shaban (8) 15: Shab-e-Barat
  if (hijri.month === 8 && hijri.day === 15) return 'আজ: শবে বরাত';
  
  // 4. Ramadan (9)
  if (hijri.month === 9) {
    if (hijri.day >= 21) return 'আজ: রমজানের শেষ দশক';
    return 'আজ: পবিত্র রমজান';
  }

  // 5. Dhul Hijjah (12) 9: Arafah
  if (hijri.month === 12 && hijri.day === 9) return 'আজ: পবিত্র আরাফাহ';

  if (mode === DayMode.FRIDAY) return 'আজ: শুক্রবার';

  return 'আজ: সাধারণ দিন';
};
