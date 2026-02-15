
import { districts } from '../data/districts';
import districtCoords from '../data/districtCoords.json';
import { getHijriDate } from './dateUtils';
import { getTimeZoneDateParts } from './dateUtils';
import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';

export interface PrayerTimesData {
  Fajr: string;   // Fajr Start
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string; // Sehri Last Time (Sahur)
  Midnight: string;
  readableDate: string;
  hijriDate: {
    day: number;
    month: number;
    year: number;
    monthEn: string;
    monthAr: string;
  }
}

const TIME_ZONE = 'Asia/Dhaka';

const formatToHHmm = (date: Date, timeZone: string = TIME_ZONE): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find(p => p.type === 'hour')?.value ?? '00';
  const minute = parts.find(p => p.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
};

const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const fetchPrayerTimes = async (
  districtId: string,
  date: Date,
  calculationMethod?: string,
  madhhab?: 'hanafi' | 'shafi'
): Promise<PrayerTimesData | null> => {
    return calculateLocalPrayerTimes(districtId, date, calculationMethod, madhhab);
};

export const fetchMonthlyPrayerTimes = async (
  districtId: string,
  month: number,
  year: number,
  calculationMethod?: string,
  madhhab?: 'hanafi' | 'shafi'
): Promise<PrayerTimesData[]> => {
    const results: PrayerTimesData[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const data = await calculateLocalPrayerTimes(districtId, date, calculationMethod, madhhab);
        if (data) results.push(data);
    }
    return results;
};

// Core Calculation Logic using Coordinates
const calculateLocalPrayerTimes = async (
  districtId: string,
  date: Date,
  calculationMethod?: string,
  madhhab?: 'hanafi' | 'shafi'
): Promise<PrayerTimesData | null> => {
    const district = districts.find(d => d.id === districtId) || districts[0];
    const coords = (districtCoords as Record<string, { lat: number; lng: number }>)[district.id] || {
      lat: district.lat,
      lng: district.lng,
    };

    const { year, month, day } = getTimeZoneDateParts(TIME_ZONE, date);
    const prayerDate = new Date(year, month - 1, day);

    const method = (calculationMethod || '').toLowerCase().includes('muslim world league')
      ? CalculationMethod.MuslimWorldLeague()
      : CalculationMethod.Karachi();
    method.madhab = (madhhab || 'hanafi') === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

    const coordinates = new Coordinates(coords.lat, coords.lng);
    const prayerTimes = new PrayerTimes(coordinates, prayerDate, method);

    const fajr = formatToHHmm(prayerTimes.fajr);
    const sunrise = formatToHHmm(prayerTimes.sunrise);
    const dhuhr = formatToHHmm(prayerTimes.dhuhr);
    const asr = formatToHHmm(prayerTimes.asr);
    const maghrib = formatToHHmm(prayerTimes.maghrib);
    const isha = formatToHHmm(prayerTimes.isha);
    const imsak = fajr;
    const sunset = maghrib;
    const midnight = "00:00";

    const hijri = getHijriDate(prayerDate, 0, TIME_ZONE);

    return {
        Fajr: fajr,
        Sunrise: sunrise,
        Dhuhr: dhuhr,
        Asr: asr,
        Sunset: sunset,
        Maghrib: maghrib,
        Isha: isha,
        Imsak: imsak,
        Midnight: midnight,
        readableDate: new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric' }).format(prayerDate),
        hijriDate: {
            day: hijri.day,
            month: hijri.month,
            year: hijri.year,
            monthEn: hijri.monthName,
            monthAr: hijri.monthName
        }
    };
};

export const parseTimeString = (timeStr: string, baseDate: Date = new Date()): Date => {
  if (!timeStr) return baseDate;
  const cleanTime = timeStr.split(' ')[0];
  const [hours, minutes] = cleanTime.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const banglaToEnglishDigits = (str: string): string => {
  const map: Record<string, string> = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return str.replace(/[০-৯]/g, (match) => map[match]);
};

export const englishToBanglaDigits = (str: string | number): string => {
  const map: Record<string, string> = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
  return String(str).replace(/[0-9]/g, (match) => map[match]);
};

// Countdown Logic
export interface PrayerCountdownState {
  percent: number;
  remainingText: string;
  label: string;
  isForbidden: boolean;
  nextWaqtName: string;
  currentWaqtName: string | null;
}

export interface ActivePrayerPeriod {
  activeName: string | null;
  nextName: string;
  targetMinutes: number;
  periodStartMinutes: number;
  labelBn: string;
  isForbidden: boolean;
}

export const getActivePeriod = (now: Date, times: PrayerTimesData): ActivePrayerPeriod => {
  const fajr = timeToMinutes(times.Fajr);
  const sunrise = timeToMinutes(times.Sunrise);
  const dhuhr = timeToMinutes(times.Dhuhr);
  const asr = timeToMinutes(times.Asr);
  const maghrib = timeToMinutes(times.Maghrib);
  const isha = timeToMinutes(times.Isha);

  const { hour, minute } = getTimeZoneDateParts(TIME_ZONE, now);
  const nowMinutes = hour * 60 + minute;
  const dayMinutes = 24 * 60;

  const preFajrStart = fajr - 120;
  const zawalStart = dhuhr - 15;
  const sunsetStart = maghrib - 15;

  if (nowMinutes < fajr) {
    if (nowMinutes >= preFajrStart) {
      return {
        activeName: 'Imsak',
        nextName: 'Fajr',
        targetMinutes: fajr,
        periodStartMinutes: preFajrStart,
        labelBn: 'সেহরি শেষ হতে বাকি',
        isForbidden: false,
      };
    }
    return {
      activeName: 'Isha',
      nextName: 'Fajr',
      targetMinutes: fajr,
      periodStartMinutes: isha - dayMinutes,
      labelBn: 'ঈশা শেষ / ফজর শুরু',
      isForbidden: false,
    };
  }

  if (nowMinutes < sunrise) {
    return {
      activeName: 'Fajr',
      nextName: 'Sunrise',
      targetMinutes: sunrise,
      periodStartMinutes: fajr,
      labelBn: 'ফজর শেষ হতে বাকি',
      isForbidden: false,
    };
  }

  if (nowMinutes < dhuhr) {
    if (nowMinutes >= zawalStart) {
      return {
        activeName: 'Ishraq/Chasht',
        nextName: 'Dhuhr',
        targetMinutes: dhuhr,
        periodStartMinutes: zawalStart,
        labelBn: 'নিষিধ সময় (জাওয়াল)',
        isForbidden: true,
      };
    }
    return {
      activeName: 'Ishraq/Chasht',
      nextName: 'Dhuhr',
      targetMinutes: dhuhr,
      periodStartMinutes: sunrise,
      labelBn: 'জুহর শুরু হতে বাকি',
      isForbidden: false,
    };
  }

  if (nowMinutes < asr) {
    return {
      activeName: 'Dhuhr',
      nextName: 'Asr',
      targetMinutes: asr,
      periodStartMinutes: dhuhr,
      labelBn: 'যুহর শেষ হতে বাকি',
      isForbidden: false,
    };
  }

  if (nowMinutes < maghrib) {
    if (nowMinutes >= sunsetStart) {
      return {
        activeName: 'Asr',
        nextName: 'Maghrib',
        targetMinutes: maghrib,
        periodStartMinutes: sunsetStart,
        labelBn: 'নিষিধ সময় (সূর্যাস্ত)',
        isForbidden: true,
      };
    }
    return {
      activeName: 'Asr',
      nextName: 'Maghrib',
      targetMinutes: maghrib,
      periodStartMinutes: asr,
      labelBn: 'আসর শেষ হতে বাকি',
      isForbidden: false,
    };
  }

  if (nowMinutes < isha) {
    return {
      activeName: 'Maghrib',
      nextName: 'Isha',
      targetMinutes: isha,
      periodStartMinutes: maghrib,
      labelBn: 'মাগরিব শেষ হতে বাকি',
      isForbidden: false,
    };
  }

  return {
    activeName: 'Isha',
    nextName: 'Fajr',
    targetMinutes: fajr + dayMinutes,
    periodStartMinutes: isha,
    labelBn: 'ঈশা শেষ / ফজর শুরু',
    isForbidden: false,
  };
};

export const calculatePrayerCountdown = (times: PrayerTimesData, now: Date): PrayerCountdownState => {
  const period = getActivePeriod(now, times);

  const { hour, minute, second } = getTimeZoneDateParts(TIME_ZONE, now);
  const nowSeconds = hour * 3600 + minute * 60 + second;
  const periodStartSeconds = period.periodStartMinutes * 60;
  const targetSeconds = period.targetMinutes * 60;

  const totalDuration = targetSeconds - periodStartSeconds;
  const elapsed = nowSeconds - periodStartSeconds;
  const percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const remainingSeconds = targetSeconds - nowSeconds;

  const rSeconds = Math.max(0, Math.floor(remainingSeconds % 60));
  const rMinutes = Math.max(0, Math.floor((remainingSeconds / 60) % 60));
  const rHours = Math.max(0, Math.floor(remainingSeconds / 3600));

  const formatTime = (t: number) => t.toString().padStart(2, '0');
  const remainingText = `${englishToBanglaDigits(formatTime(rHours))}:${englishToBanglaDigits(formatTime(rMinutes))}:${englishToBanglaDigits(formatTime(rSeconds))}`;

  return {
    percent,
    remainingText,
    label: period.labelBn,
    isForbidden: period.isForbidden,
    nextWaqtName: period.nextName,
    currentWaqtName: period.activeName,
  };
};
